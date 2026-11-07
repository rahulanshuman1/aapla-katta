import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, inr } from '../api';
import MapView from '../components/MapView';
import useRoute from '../useRoute';
import { useApp } from '../store';

export const DELIVERY_STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'completed'];
export const DELIVERY_LABEL = { placed: 'Order placed', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Packed', 'out-for-delivery': 'On the way', completed: 'Delivered' };

// straight-line distance in km (haversine)
function km(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const ago = (ms) => (ms < 5000 ? 'just now' : ms < 60000 ? `${Math.round(ms / 1000)}s ago` : `${Math.round(ms / 60000)} min ago`);

export default function Track() {
  const { code } = useParams();
  const nav = useNavigate();
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');
  const [input, setInput] = useState('');
  const [now, setNow] = useState(Date.now());
  const statusRef = useRef('');
  const { settings } = useApp();
  const origin = Number.isFinite(parseFloat(settings.contact?.lat)) && Number.isFinite(parseFloat(settings.contact?.lng)) ? { lat: parseFloat(settings.contact.lat), lng: parseFloat(settings.contact.lng) } : null;
  const roadFrom = t?.location || (t && t.status !== 'completed' && t.status !== 'cancelled' ? origin : null);
  const road = useRoute(roadFrom, t?.destination || null);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  // Poll for live updates: every 5 s while on the road, slower before that, stop when finished
  useEffect(() => {
    if (!code) return undefined;
    let stop = false, timer;
    setT(null); setErr('');
    const load = async () => {
      let next = 10000;
      try {
        const d = await api.get(`/track/${encodeURIComponent(code)}`);
        if (stop) return;
        setT(d.track); setErr('');
        statusRef.current = d.track.status;
        next = d.track.status === 'out-for-delivery' ? 5000 : ['completed', 'cancelled'].includes(d.track.status) ? 0 : 15000;
      } catch (e) {
        if (stop) return;
        if (e.status === 404) { setErr('We could not find that tracking ID. Please check it and try again.'); next = 0; }
        else if (!statusRef.current) setErr(e.message);
      }
      if (next) timer = setTimeout(load, next);
    };
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, [code]);

  if (!code) {
    return (
      <div className="container narrow page-pad">
        <h1 className="page-title">Track your order</h1>
        <form className="card" onSubmit={(e) => { e.preventDefault(); input.trim() && nav(`/track/${input.trim().toUpperCase()}`); }}>
          <label>Tracking ID<input value={input} onChange={(e) => setInput(e.target.value)} placeholder="TRK-XXXXXXXXXX" /></label>
          <button className="btn btn-primary">Track</button>
          <p className="muted small" style={{ marginTop: 12 }}>You'll find your tracking ID in your order confirmation email and under <Link to="/orders">My orders</Link>.</p>
        </form>
      </div>
    );
  }

  if (err && !t) return <div className="container narrow page-pad center"><div className="empty-emoji">🔍</div><h2>{err}</h2><Link to="/track" className="btn btn-primary" style={{ marginTop: 16 }}>Try another ID</Link></div>;
  if (!t) return <div className="page-loader"><div className="spinner" /></div>;

  const cancelled = t.status === 'cancelled';
  const idx = DELIVERY_STEPS.indexOf(t.status);
  const onRoad = t.status === 'out-for-delivery';
  const delivered = t.status === 'completed';
  const loc = t.location;
  const dist = road && loc ? road.km : loc && t.destination ? km(loc, t.destination) : null;
  const eta = road && loc ? road.minutes : dist != null ? Math.max(1, Math.round((dist / 18) * 60)) : null; // road ETA via OSRM, else ~18 km/h straight-line
  const stale = loc && loc.at ? now - new Date(loc.at).getTime() : 0;

  return (
    <div className="container narrow page-pad">
      <div className="track-head">
        <div><h1 className="page-title" style={{ marginBottom: 4 }}>{delivered ? 'Delivered 🎉' : cancelled ? 'Order cancelled' : onRoad ? 'On the way 🛵' : 'Tracking your order'}</h1>
          <p className="muted" style={{ margin: 0 }}>Order #{t.orderNo} · Tracking ID <b>{t.trackingId}</b></p></div>
        <span className={`status s-${t.status}`}>{DELIVERY_LABEL[t.status] || t.status}</span>
      </div>

      {delivered && <motion.div className="success-banner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>✅ Your order was delivered{t.deliveredAt ? ` at ${new Date(t.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}. Enjoy your meal!</motion.div>}

      {!cancelled && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="track">{DELIVERY_STEPS.map((s, n) => <div key={s} className={`track-step ${n <= idx ? 'done' : ''}`}><i />{DELIVERY_LABEL[s]}</div>)}</div>
        </div>
      )}

      {onRoad && (
        <div className="card map-card">
          {loc ? <MapView rider={loc} dest={t.destination} origin={origin} route={road?.coords} height={340} /> : (
            <div className="map-wait"><div className="spinner" /><p>Waiting for your delivery partner's live location…</p></div>
          )}
          {loc && (
            <div className="eta-row">
              {eta != null ? <div><b>≈ {eta} min</b><small>{dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} away{road ? '' : ' (approx.)'}</small></div> : <div><b>Live location</b><small>Pin your address at checkout next time to see the ETA</small></div>}
              <small className={stale > 60000 ? 'warn' : 'muted'}>● Updated {ago(stale)}</small>
            </div>
          )}
        </div>
      )}

      {!onRoad && !delivered && !cancelled && road && t.destination && (
        <div className="card map-card">
          <MapView dest={t.destination} origin={origin} route={road.coords} height={260} />
          <div className="eta-row"><div><b>≈ {road.minutes} min</b><small>{road.km.toFixed(1)} km from the restaurant to you</small></div><small className="muted">Estimated delivery ride</small></div>
        </div>
      )}

      {t.rider ? (
        <div className="card rider-card">
          <div className="rider-avatar">🛵</div>
          <div className="rider-info"><small className="muted">Your delivery partner</small><b>{t.rider.name}</b><span>{t.rider.phone}</span></div>
          {!delivered && <a className="btn btn-primary btn-sm" href={`tel:${String(t.rider.phone).replace(/\s/g, '')}`}>📞 Call</a>}
        </div>
      ) : !cancelled && !delivered && (
        <div className="card muted" style={{ textAlign: 'center' }}>⏳ A delivery partner will be assigned shortly. You'll see their name and number here.</div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Order summary</h3>
        <ul className="order-items">{t.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}{i.variant && ` (${i.variant})`}</span></li>)}</ul>
        <div className="order-foot"><span className="muted">{t.paymentMethod === 'online' ? (t.paymentStatus === 'paid' ? 'Paid online ✓' : 'Payment pending') : (t.paymentStatus === 'paid' ? 'Paid in cash ✓' : 'Pay cash on delivery')}</span><b>{inr(t.total)}</b></div>
      </div>
      <p className="center" style={{ marginTop: 18 }}><Link to="/orders" className="link-btn">← My orders</Link></p>
    </div>
  );
}
