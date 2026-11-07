import { useState } from 'react';
import MapView from './MapView';

/** Checkout helper: customer shares GPS or drops/drags a pin so the rider (and live map) knows exactly where to go. */
export default function LocationPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const locate = () => {
    if (!navigator.geolocation) return setErr('Your browser cannot share location. Tap the map to drop a pin instead.');
    setBusy(true); setErr('');
    navigator.geolocation.getCurrentPosition(
      (p) => { onChange({ lat: p.coords.latitude, lng: p.coords.longitude }); setBusy(false); },
      (e) => { setBusy(false); setErr(e.code === 1 ? 'Location permission was denied. Tap the map to drop a pin instead.' : 'Could not get your location. Tap the map to drop a pin instead.'); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="locpick">
      <div className="locpick-head">
        <div><b>📍 Pin your delivery location</b><small className="muted">Recommended – lets you see your rider arrive on the map.</small></div>
        <button type="button" className="btn btn-sm btn-outline" onClick={locate} disabled={busy}>{busy ? 'Locating…' : '🎯 Use my current location'}</button>
      </div>
      <MapView dest={value} onPick={(lat, lng) => onChange({ lat, lng })} height={230} />
      <small className="muted">{value ? '✅ Pin set. Drag it or tap the map to adjust.' : 'Tap the map to drop a pin.'}</small>
      {err && <p className="alert err">{err}</p>}
    </div>
  );
}
