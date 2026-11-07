import { useCallback, useEffect, useState } from 'react';
import { api, inr } from '../api';
import { useApp } from '../store';

const navLink = (o) => {
  const d = o.deliveryLocation && o.deliveryLocation.lat != null ? `${o.deliveryLocation.lat},${o.deliveryLocation.lng}` : encodeURIComponent(o.address || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=two_wheeler`;
};

/** Delivery partner's page (phone friendly): see assigned orders, start delivery (shares live GPS), mark delivered. */
export default function Delivery() {
  const { toast, user } = useApp();
  const [orders, setOrders] = useState(null);
  const [gps, setGps] = useState('off'); // off | on | denied | error
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api.get('/delivery/my').then((d) => setOrders(d.orders)).catch((e) => toast(e.message, 'err')), [toast]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const onRoad = (orders || []).filter((o) => o.status === 'out-for-delivery');
  const hasRoad = onRoad.length > 0;

  // Share live GPS for as long as at least one order is "out for delivery"
  useEffect(() => {
    if (!hasRoad) { setGps('off'); return undefined; }
    if (!navigator.geolocation) { setGps('error'); return undefined; }
    let last = 0, wake = null, closed = false;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGps('on');
        const t = Date.now();
        if (t - last < 4000) return; // send at most every ~4 s
        last = t;
        const c = pos.coords;
        api.post('/delivery/location', { lat: c.latitude, lng: c.longitude, heading: c.heading, speed: c.speed, accuracy: c.accuracy }).catch(() => {});
      },
      (e) => setGps(e.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    // keep the screen awake so the browser keeps reporting the position
    const lock = () => navigator.wakeLock && navigator.wakeLock.request('screen').then((w) => { if (closed) w.release(); else wake = w; }).catch(() => {});
    lock();
    const vis = () => document.visibilityState === 'visible' && lock();
    document.addEventListener('visibilitychange', vis);
    return () => { closed = true; navigator.geolocation.clearWatch(id); document.removeEventListener('visibilitychange', vis); wake && wake.release && wake.release().catch(() => {}); };
  }, [hasRoad]);

  const act = async (o, what, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(o._id);
    try { await api.post(`/delivery/orders/${o._id}/${what}`, {}); await load(); toast(what === 'start' ? 'Delivery started – live location is being shared 📍' : 'Marked as delivered ✅'); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };

  const active = (orders || []).filter((o) => o.status !== 'completed');
  const done = (orders || []).filter((o) => o.status === 'completed');

  return (
    <div className="container narrow page-pad">
      <h1 className="page-title">My deliveries</h1>
      <p className="muted">Hi {user.name.split(' ')[0]} 👋 Keep this page open while delivering – it shares your live location with the customer.</p>

      {hasRoad && (
        <div className={`gps-bar ${gps}`}>
          {gps === 'on' && '🟢 Sharing live location'}
          {gps === 'off' && '⏳ Getting your location…'}
          {gps === 'denied' && '🔴 Location is blocked. Allow location for this site in your browser settings, then refresh.'}
          {gps === 'error' && '🟠 Could not read your location. Check that GPS is on.'}
        </div>
      )}

      {!orders && <div className="center"><div className="spinner" /></div>}
      {orders && !active.length && <div className="center muted" style={{ padding: 40 }}><div className="empty-emoji">🛵</div><p>No deliveries assigned right now.<br />New assignments appear here automatically.</p></div>}

      {active.map((o) => (
        <div key={o._id} className="card order-card">
          <div className="order-head">
            <div><b>#{o.orderNo}</b> <small className="muted">· {o.trackingId}</small></div>
            <span className={`status s-${o.status}`}>{o.status === 'out-for-delivery' ? 'On the way' : o.status}</span>
          </div>
          <p className="order-who"><b>{o.customerName}</b> · <a href={`tel:${o.phone}`}>📞 {o.phone}</a></p>
          <p className="small">📍 {o.address}</p>
          {o.notes && <p className="note-box">📝 {o.notes}</p>}
          <ul className="order-items">{o.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}{i.variant && ` (${i.variant})`}</span></li>)}</ul>
          {o.paymentMethod === 'cod' && o.paymentStatus !== 'paid'
            ? <p className="collect">💵 Collect <b>{inr(o.total)}</b> in cash</p>
            : <p className="paid-note">✅ Already paid online – nothing to collect</p>}
          <div className="btn-row">
            <a className="btn btn-outline btn-sm" href={navLink(o)} target="_blank" rel="noreferrer">🧭 Navigate</a>
            {o.status !== 'out-for-delivery'
              ? <button className="btn btn-primary btn-sm" disabled={busy === o._id} onClick={() => act(o, 'start')}>{busy === o._id ? 'Starting…' : '🛵 Start delivery'}</button>
              : <button className="btn btn-gold btn-sm" disabled={busy === o._id} onClick={() => act(o, 'deliver', `Mark order #${o.orderNo} as delivered?`)}>{busy === o._id ? 'Saving…' : '✅ Mark delivered'}</button>}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <h3 style={{ marginTop: 28 }}>Delivered in the last 24 hours</h3>
          {done.map((o) => (
            <div key={o._id} className="card order-card done-card">
              <div className="order-head"><div><b>#{o.orderNo}</b> <small className="muted">· {o.customerName}</small></div><span className="status s-completed">Delivered</span></div>
              <small className="muted">{o.delivery?.deliveredAt && new Date(o.delivery.deliveredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {inr(o.total)}</small>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
