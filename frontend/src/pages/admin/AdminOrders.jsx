import { useEffect, useState } from 'react';
import { api, inr } from '../../api';
import { useApp } from '../../store';

const FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
const FILTERS = ['all', ...FLOW, 'cancelled'];

export default function AdminOrders() {
  const { toast } = useApp();
  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [o, s] = await Promise.all([api.get('/orders'), api.get('/orders/stats')]);
      setOrders(o.orders); setStats(s);
    } catch (e) { toast(e.message, 'err'); }
  };
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []); // eslint-disable-line

  const setStatus = async (o, status) => {
    try {
      const d = await api.put(`/orders/${o._id}/status`, { status });
      setOrders((list) => list.map((x) => (x._id === o._id ? d.order : x)));
      toast(`#${o.orderNo} → ${status}`);
    } catch (e) { toast(e.message, 'err'); }
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
        {list.map((o) => (
          <div key={o._id} className="card order-card">
            <div className="order-head">
              <div><b>#{o.orderNo}</b> <small className="muted">· {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
              <span className={`status s-${o.status}`}>{o.status}</span>
            </div>
            <p className="order-who"><b>{o.customerName}</b> · <a href={`tel:${o.phone}`}>{o.phone}</a> · {o.customerEmail}</p>
            <p className="muted small">
              {o.orderType}{o.tableNo && ` · Table ${o.tableNo}`}{o.address && ` · ${o.address}`} · {o.paymentMethod === 'online' ? `Online (${o.paymentStatus})` : `Pay at restaurant (${o.paymentStatus})`}
            </p>
            <ul className="order-items">
              {o.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}{i.variant && ` (${i.variant})`}</span><span>{inr(i.price * i.qty)}</span></li>)}
            </ul>
            {o.notes && <p className="note-box">📝 {o.notes}</p>}
            <div className="order-foot"><b>Total {inr(o.total)}</b>
              <div className="btn-row">
                {o.status !== 'cancelled' && o.status !== 'completed' && FLOW.slice(FLOW.indexOf(o.status) + 1).slice(0, 1).map((n) => (
                  <button key={n} className="btn btn-sm btn-primary" onClick={() => setStatus(o, n)}>Mark {n}</button>
                ))}
                {o.status !== 'cancelled' && o.status !== 'completed' && <button className="btn btn-sm btn-outline" onClick={() => window.confirm('Cancel this order?') && setStatus(o, 'cancelled')}>Cancel</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
