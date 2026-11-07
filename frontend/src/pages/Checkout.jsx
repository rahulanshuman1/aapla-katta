import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, inr } from '../api';
import { useApp } from '../store';
import LocationPicker from '../components/LocationPicker';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout. Resolves with the verified order, rejects on dismiss / verification problems. */
export async function payWithRazorpay({ payment, order, user, settings }) {
  if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your internet connection.');
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, v) => { if (!settled) { settled = true; fn(v); } };
    const rz = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: settings.brand.name,
      description: `Order ${order.orderNo}`,
      order_id: payment.razorpayOrderId,
      prefill: { name: user.name, email: user.email, contact: order.phone },
      notes: { orderNo: order.orderNo },
      theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#C8102E' },
      modal: { ondismiss: () => done(reject, Object.assign(new Error('Payment cancelled'), { dismissed: true })) },
      handler: async (resp) => {
        try {
          const d = await api.post('/orders/verify-payment', resp);
          done(resolve, d.order);
        } catch (e) {
          // The customer HAS paid – never leave them on a spinner, send them to My Orders instead
          done(reject, Object.assign(new Error('Payment received! Your confirmation is taking a little longer – please check My Orders in a minute.'), { paid: true }));
        }
      },
    });
    // A failed attempt is not final: Razorpay lets the customer retry inside the same window,
    // so we only react to success (handler) or to the window being closed (ondismiss).
    rz.open();
  });
}

export default function Checkout() {
  const { cart, cartTotal, changeQty, clearCart, user, settings, meta, toast } = useApp();
  const nav = useNavigate();
  const ch = settings.charges;
  const [f, setF] = useState({ phone: user.phone || '', orderType: 'dine-in', tableNo: '', address: user.address || '', notes: '', location: null, paymentMethod: meta.razorpayEnabled ? 'online' : 'cod' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [snap, setSnap] = useState(null); // frozen copy of the cart once the order is placed (cart itself is cleared)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const lines = snap ? snap.lines : cart;
  const subtotal = snap ? snap.subtotal : cartTotal;
  const gst = Math.round((subtotal * ch.gstPercent) / 100);
  const delivery = f.orderType === 'delivery' ? Number(ch.deliveryFee) || 0 : 0;
  const total = subtotal + gst + delivery;

  if (!cart.length && !snap) {
    return <div className="container narrow center page-pad"><div className="empty-emoji">🛒</div><h2>Your cart is empty</h2><Link to="/menu" className="btn btn-primary" style={{ marginTop: 16 }}>Browse the menu</Link></div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr('');
    if (cartTotal < ch.minOrder) return setErr(`Minimum order value is ${inr(ch.minOrder)}`);
    setBusy(true);
    try {
      const { location, ...fields } = f;
      const d = await api.post('/orders', { ...fields, deliveryLocation: f.orderType === 'delivery' ? location : undefined, items: cart.map((l) => ({ itemId: l.itemId, variant: l.variant, qty: l.qty })) });
      // The order now exists on the server – empty the cart right away so it can never be re-submitted or left behind
      setSnap({ lines: cart, subtotal: cartTotal });
      clearCart();
      if (f.paymentMethod === 'online') {
        try {
          await payWithRazorpay({ payment: d.payment, order: d.order, user, settings });
        } catch (pe) {
          toast(pe.dismissed ? 'Payment not completed. You can finish it from My Orders.' : pe.message, pe.paid ? 'ok' : 'err');
          return nav('/orders');
        }
      }
      nav('/orders', { state: { placed: d.order.orderNo, trackingId: d.order.trackingId } });
    } catch (e2) {
      setErr(e2.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="container page-pad">
      <h1 className="page-title">Checkout</h1>
      <form className="checkout" onSubmit={submit}>
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Order details</h3>
          <div className="seg seg-lg">
            {[['dine-in', '🍽️ Dine-in'], ['takeaway', '🥡 Takeaway'], ['delivery', '🛵 Delivery']].map(([v, l]) => (
              <button type="button" key={v} className={f.orderType === v ? 'on' : ''} onClick={() => setF({ ...f, orderType: v })}>{l}</button>
            ))}
          </div>
          <label>Name<input value={user.name} disabled /></label>
          <label>Phone number<input required type="tel" inputMode="tel" placeholder="10-digit mobile number" value={f.phone} onChange={set('phone')} /></label>
          {f.orderType === 'dine-in' && <label>Table number (optional)<input value={f.tableNo} onChange={set('tableNo')} placeholder="e.g. 5" /></label>}
          {f.orderType === 'delivery' && <label>Delivery address<textarea required rows={3} value={f.address} onChange={set('address')} placeholder="House / flat, street, landmark" /></label>}
          {f.orderType === 'delivery' && <LocationPicker value={f.location} onChange={(location) => setF((x) => ({ ...x, location }))} />}
          <label>Cooking instructions (optional)<textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="Less spicy, no onion…" /></label>

          <h3 style={{ marginTop: 22 }}>Payment</h3>
          <div className="pay-opts">
            {meta.razorpayEnabled && (
              <label className={`pay-opt ${f.paymentMethod === 'online' ? 'on' : ''}`}>
                <input type="radio" name="pm" checked={f.paymentMethod === 'online'} onChange={() => setF({ ...f, paymentMethod: 'online' })} />
                <div><b>💳 Pay online</b><small>UPI, cards, netbanking & wallets via Razorpay</small></div>
              </label>
            )}
            {ch.enableCOD && (
              <label className={`pay-opt ${f.paymentMethod === 'cod' ? 'on' : ''}`}>
                <input type="radio" name="pm" checked={f.paymentMethod === 'cod'} onChange={() => setF({ ...f, paymentMethod: 'cod' })} />
                <div><b>💵 Pay at restaurant / on delivery</b><small>Cash or UPI when you receive your order</small></div>
              </label>
            )}
          </div>
        </motion.div>

        <motion.div className="card summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>Summary</h3>
          {lines.map((l) => (
            <div key={l.key} className="sum-line">
              <span>{l.name}{l.variant && <small> ({l.variant})</small>}</span>
              <div className="stepper stepper-sm">
                <button type="button" disabled={!!snap} onClick={() => changeQty(l.key, -1)}>−</button><span>{l.qty}</span><button type="button" disabled={!!snap} onClick={() => changeQty(l.key, 1)}>+</button>
              </div>
              <b>{inr(l.price * l.qty)}</b>
            </div>
          ))}
          <hr />
          <div className="row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          {gst > 0 && <div className="row"><span>GST ({ch.gstPercent}%)</span><span>{inr(gst)}</span></div>}
          {delivery > 0 && <div className="row"><span>Delivery fee</span><span>{inr(delivery)}</span></div>}
          <div className="row total"><span>Total</span><span>{inr(total)}</span></div>
          {err && <p className="alert err">{err}</p>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy || !f.paymentMethod}>
            {busy ? 'Please wait…' : f.paymentMethod === 'online' ? `Pay ${inr(total)}` : 'Place order'}
          </button>
          <small className="muted">Orders once placed cannot be cancelled. A confirmation will be emailed to {user.email}.</small>
        </motion.div>
      </form>
    </div>
  );
}
