import { useCallback, useEffect, useState } from 'react';
import { api, inr } from '../api';
import { useApp } from '../store';
import { isNative, watchPosition, openAppSettings } from '../native';

const navLink = (o) => {
  const d = o.deliveryLocation && o.deliveryLocation.lat != null ? `${o.deliveryLocation.lat},${o.deliveryLocation.lng}` : encodeURIComponent(o.address || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=two_wheeler`;
};

/** Delivery partner's page (phone friendly): see assigned orders, start delivery (shares live GPS), mark delivered. */
export default function Delivery() {
  const { toast, user } = useApp();
  const [orders, setOrders] = useState(null);
  const [gps, setGps] = useState('off'); // off | on | denied | error | senderr
  const [sent, setSent] = useState(0);
  const [sendErr, setSendErr] = useState('');
  const [hidden, setHidden] = useState(false);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(i); }, []);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api.get('/delivery/my').then((d) => setOrders(d.orders)).catch((e) => toast(e.message, 'err')), [toast]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const onRoad = (orders || []).filter((o) => o.status === 'out-for-delivery');
  const hasRoad = onRoad.length > 0;

  // Share live GPS for as long as at least one order is "out for delivery".
  // watchPosition only fires when the device MOVES, so a heartbeat re-sends the latest fix every 5 s (keeps "updated Xs ago" fresh).
  useEffect(() => {
    if (!hasRoad) { setGps('off'); return undefined; }
    if (!isNative && !navigator.geolocation) { setGps('error'); return undefined; }
    let fix = null, wake = null, closed = false, failing = 0, lastSent = 0;
    const send = () => {
      if (!fix) return;
      const c = fix;
      lastSent = Date.now();
      api.post('/delivery/location', { lat: c.latitude, lng: c.longitude, heading: c.heading, speed: c.speed, accuracy: c.accuracy })
        .then(() => { failing = 0; setGps('on'); setSent(Date.now()); })
        .catch((e) => { failing += 1; if (failing >= 2) { setGps('senderr'); setSendErr(e.message || 'Could not reach the server'); } });
    };
    // in the mobile app this is a native background watcher (works with the screen off); on the web it is the browser's geolocation
    const stopWatch = watchPosition(
      (c) => { const first = !fix; fix = c; if (first || (isNative && Date.now() - lastSent >= 4000)) send(); }, // in the app, send from the GPS callback itself – JS timers are throttled in the background
      (e) => setGps(e.code === 1 ? 'denied' : 'error')
    );
    const beat = setInterval(send, 5000);
    // keep the screen awake so the browser keeps reporting the position
    const lock = () => navigator.wakeLock && navigator.wakeLock.request('screen').then((w) => { if (closed) w.release(); else wake = w; }).catch(() => {});
    lock();
    const vis = () => { setHidden(!isNative && document.visibilityState !== 'visible'); if (document.visibilityState === 'visible') { lock(); send(); } };
    document.addEventListener('visibilitychange', vis);
    return () => { closed = true; clearInterval(beat); stopWatch(); document.removeEventListener('visibilitychange', vis); wake && wake.release && wake.release().catch(() => {}); };
  }, [hasRoad]);

  const act = async (o, what, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(o._id);
    try {
      let body = {};
      if (what === 'start' && navigator.geolocation) {
        body = await new Promise((res) => navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res({}), { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }));
      }
      await api.post(`/delivery/orders/${o._id}/${what}`, body); await load(); toast(what === 'start' ? 'Delivery started – live location is being shared 📍' : 'Marked as delivered ✅'); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };

  const active = (orders || []).filter((o) => o.status !== 'completed');
  const done = (orders || []).filter((o) => o.status === 'completed');

  return (
    <div className="container narrow page-pad">
      <h1 className="page-title">My deliveries</h1>
      <p className="muted">Hi {user.name.split(' ')[0]} 👋 {isNative ? 'Your live location is shared with the customer while a delivery is on the way – even if the app is in the background.' : 'Keep this page open while delivering – it shares your live location with the customer.'}</p>

      {hasRoad && (<>
        <div className={`gps-bar ${gps}`}>
          {gps === 'on' && `🟢 Sharing live location${sent ? ` · sent ${Math.max(0, Math.round((tick - sent) / 1000))}s ago` : ''}`}
          {gps === 'senderr' && `🔴 Location is NOT reaching the customer (${sendErr}). Check your internet.`}
          {gps === 'off' && '⏳ Getting your location…'}
          {gps === 'denied' && <>🔴 Location is blocked. Allow location for {isNative ? 'this app' : 'this site'} in settings{isNative ? <> — <button type="button" className="link-btn" onClick={openAppSettings}>open settings</button></> : ', then refresh'}.</>}
          {gps === 'error' && '🟠 Could not read your location. Check that GPS is on.'}
        </div>
        {hasRoad && hidden && <p className="alert err">This tab is in the background – the browser may stop sharing location. Keep this page on screen.</p>}
      </>)}

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
