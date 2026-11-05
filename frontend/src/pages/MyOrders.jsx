import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, inr } from '../api';
import { useApp } from '../store';
import { payWithRazorpay } from './Checkout';

const STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
const LABEL = { 'pending-payment': 'Awaiting payment', placed: 'Order placed', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };

export default function MyOrders() {
  const { user, settings, toast } = useApp();
  const { state } = useLocation();
  const [orders, setOrders] = useState(null);

  const load = () => api.get('/orders/mine').then((d) => setOrders(d.orders)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); const t = setInterval(load, 25000); return () => clearInterval(t); }, []); // eslint-disable-line

  const retry = async (o) => {
    try {
      const d = await api.post(`/orders/${o._id}/pay`);
      await payWithRazorpay({ payment: d.payment, order: d.order, user, settings });
      toast('Payment successful 🎉');
      load();
    } catch (e) { if (!e.dismissed) toast(e.message, 'err'); }
  };

  return (
    <div className="container narrow page-pad">
      <h1 className="page-title">My orders</h1>
      {state?.placed && (
        <motion.div className="success-banner" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          🎉 Order <b>#{state.placed}</b> placed! A confirmation email is on its way.
        </motion.div>
      )}
      {!orders && <div className="center"><div className="spinner" /></div>}
      {orders && !orders.length && <div className="center muted" style={{ padding: 40 }}><div className="empty-emoji">📦</div><p>No orders yet.</p><Link to="/menu" className="btn btn-primary" style={{ marginTop: 12 }}>Order now</Link></div>}
      {(orders || []).map((o) => {
        const idx = STEPS.indexOf(o.status);
        return (
          <motion.div key={o._id} className="card order-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="order-head">
              <div><b>#{o.orderNo}</b><small className="muted"> · {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
              <span className={`status s-${o.status}`}>{LABEL[o.status]}</span>
            </div>
            <ul className="order-items">
              {o.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}{i.variant && ` (${i.variant})`}</span><span>{inr(i.price * i.qty)}</span></li>)}
            </ul>
            <div className="order-foot">
              <span className="muted">{o.orderType} · {o.paymentMethod === 'online' ? (o.paymentStatus === 'paid' ? 'Paid online ✓' : 'Payment pending') : 'Pay at restaurant'}</span>
              <b>{inr(o.total)}</b>
            </div>
            {idx >= 0 && (
              <div className="track">{STEPS.map((s, n) => <div key={s} className={`track-step ${n <= idx ? 'done' : ''}`}><i />{LABEL[s]}</div>)}</div>
            )}
            {o.status === 'pending-payment' && <button className="btn btn-primary btn-sm" onClick={() => retry(o)}>Complete payment</button>}
          </motion.div>
        );
      })}
    </div>
  );
}
