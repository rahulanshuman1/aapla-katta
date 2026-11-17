import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../../api';
import { useApp } from '../../store';

const FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
const FILTERS = ['all', 'placed', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'completed', 'cancelled'];
const ago = (d) => { const s = (Date.now() - new Date(d).getTime()) / 1000; return s < 10 ? 'just now' : s < 60 ? `${Math.round(s)}s ago` : `${Math.round(s / 60)} min ago`; };

export default function AdminOrders() {
  const { toast } = useApp();
  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [o, s] = await Promise.all([api.get('/orders'), api.get('/orders/stats')]);
      setOrders(o.orders); setStats(s);
    } catch (e) { toast(e.message, 'err'); }
  };
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []); // eslint-disable-line
  useEffect(() => { api.get('/delivery/partners').then((d) => setPartners(d.partners)).catch(() => {}); }, []);

  const replace = (o) => setOrders((list) => list.map((x) => (x._id === o._id ? o : x)));

  const setStatus = async (o, status) => {
    try { const d = await api.put(`/orders/${o._id}/status`, { status }); replace(d.order); toast(`#${o.orderNo} → ${status}`); }
    catch (e) { toast(e.message, 'err'); }
  };
  const assign = async (o, partnerId) => {
    try { const d = await api.put(`/delivery/orders/${o._id}/assign`, { partnerId }); replace(d.order); toast(partnerId ? 'Delivery partner assigned ✓ (customer notified)' : 'Partner un-assigned'); }
    catch (e) { toast(e.message, 'err'); }
  };

  const list = (orders || []).filter((o) => filter === 'all' || o.status === filter);

  return (
    <>
      {stats && (
        <div className="stat-row">
          <div className="stat"><b>{stats.ordersToday}</b><span>Orders today</span></div>
          <div className="stat"><b>{inr(stats.revenueToday)}</b><span>Revenue today</span></div>
          <div className="stat"><b>{stats.openOrders}</b><span>Open orders</span></div>
        </div>
      )}
      <div className="pills" style={{ margin: '16px 0' }}>
        {FILTERS.map((f) => <button key={f} className={`pill ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        <button className="pill pill-soft" onClick={load}>↻ Refresh</button>
      </div>
      {!orders && <div className="center"><div className="spinner" /></div>}
      {orders && !list.length && <p className="muted center" style={{ padding: 40 }}>No orders here yet.</p>}
      <div className="admin-orders">
        {list.map((o) => {
          const isDelivery = o.orderType === 'delivery';
          const d = o.delivery || {};
          const finished = o.status === 'completed' || o.status === 'cancelled';
          // delivery orders: kitchen steps stop at "ready"; the rider takes it from there
          const next = finished ? null : isDelivery ? (['placed', 'confirmed', 'preparing'].includes(o.status) ? FLOW[FLOW.indexOf(o.status) + 1] : null) : FLOW[FLOW.indexOf(o.status) + 1];
          return (
            <div key={o._id} className="card order-card">
              <div className="order-head">
                <div><b>#{o.orderNo}</b> <small className="muted">· {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
                <span className={`status s-${o.status}`}>{o.status === 'out-for-delivery' ? 'On the way' : o.status === 'completed' && isDelivery ? 'Delivered' : o.status}</span>
              </div>
              <p className="order-who"><b>{o.customerName}</b> · <a href={`tel:${o.phone}`}>{o.phone}</a> · {o.customerEmail}</p>
              <p className="muted small">
                {o.orderType}{o.tableNo && ` · Table ${o.tableNo}`}{o.address && ` · ${o.address}`} · {o.paymentMethod === 'online' ? `Online (${o.paymentStatus})` : `Pay at restaurant (${o.paymentStatus})`}
              </p>
              <ul className="order-items">
                {o.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}{i.variant && ` (${i.variant})`}</span><span>{inr(i.price * i.qty)}</span></li>)}
                {o.discount > 0 && <li className="coupon-line"><span>🎟️ Coupon {o.couponCode}{o.couponPercent ? ` (${o.couponPercent}% off)` : ''}</span><span>−{inr(o.discount)}</span></li>}
              </ul>
              {o.notes && <p className="note-box">📝 {o.notes}</p>}

              {isDelivery && (
                <div className="delivery-box">
                  <div className="dbox-row"><span>🔎 Tracking ID</span><b>{o.trackingId}</b></div>
                  {o.deliveryLocation?.lat != null && <div className="dbox-row"><span>📍 Customer pin</span><a href={`https://www.google.com/maps?q=${o.deliveryLocation.lat},${o.deliveryLocation.lng}`} target="_blank" rel="noreferrer">Open map</a></div>}
                  {!finished && o.status !== 'out-for-delivery' ? (
                    <label className="dbox-assign">🛵 Delivery partner
                      <select value={d.partner || ''} onChange={(e) => assign(o, e.target.value)}>
                        <option value="">— Not assigned —</option>
                        {partners.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.phone} ({p.activeOrders} active)</option>)}
                      </select>
                    </label>
                  ) : d.name && <div className="dbox-row"><span>🛵 Delivery partner</span><b>{d.name} · {d.phone}</b></div>}
                  {!partners.length && !finished && <small className="muted">No delivery partners yet – add them in the “Delivery team” tab.</small>}
                  {o.status === 'out-for-delivery' && <div className="dbox-row"><span>📡 Live location</span><b>{d.location?.at ? `updated ${ago(d.location.at)}` : 'waiting for rider GPS…'}</b></div>}
                  {d.deliveredAt && <div className="dbox-row"><span>✅ Delivered</span><b>{new Date(d.deliveredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>}
                  {o.trackingId && <Link className="link-btn" to={`/track/${o.trackingId}`} target="_blank">View customer tracking page ↗</Link>}
                </div>
              )}

              <div className="order-foot"><b>Total {inr(o.total)}</b>
                <div className="btn-row">
                  {next && <button className="btn btn-sm btn-primary" onClick={() => setStatus(o, next)}>Mark {next}</button>}
                  {isDelivery && o.status === 'ready' && !d.partner && <small className="muted">Assign a partner →</small>}
                  {isDelivery && o.status === 'out-for-delivery' && <button className="btn btn-sm btn-gold" onClick={() => window.confirm('Mark as delivered manually? (Normally the rider does this.)') && setStatus(o, 'completed')}>Mark delivered</button>}
                  {!finished && <button className="btn btn-sm btn-outline" onClick={() => window.confirm('Cancel this order?') && setStatus(o, 'cancelled')}>Cancel</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
