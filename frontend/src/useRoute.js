import { useEffect, useRef, useState } from 'react';

// Distance in metres between two {lat,lng}
function metres(a, b) {
  const R = 6371000, rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/**
 * Best driving route between two points using the free OSRM service (OpenStreetMap data).
 * Returns { coords: [[lat,lng],...], minutes, km } or null. Re-fetches when the start moves >80 m
 * (and at most every 15 s), keeps the previous route on screen meanwhile.
 */
export default function useRoute(from, to) {
  const [route, setRoute] = useState(null);
  const last = useRef({ from: null, to: null, at: 0 });
  const fl = from?.lat, fg = from?.lng, tl = to?.lat, tg = to?.lng;

  useEffect(() => {
    if (![fl, fg, tl, tg].every(Number.isFinite)) { setRoute(null); return undefined; }
    const l = last.current;
    const movedFrom = !l.from || metres(l.from, { lat: fl, lng: fg }) > 80;
    const changedTo = !l.to || l.to.lat !== tl || l.to.lng !== tg;
    if (!changedTo && (!movedFrom || Date.now() - l.at < 15000)) return undefined;
    last.current = { from: { lat: fl, lng: fg }, to: { lat: tl, lng: tg }, at: Date.now() };
    const ctl = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${fg},${fl};${tg},${tl}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const r = d.routes && d.routes[0];
        if (!r) return;
        setRoute({ coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), minutes: Math.max(1, Math.round(r.duration / 60)), km: r.distance / 1000 });
      })
      .catch(() => { /* offline / service busy: keep last route, caller falls back to straight-line ETA */ });
    return () => ctl.abort();
  }, [fl, fg, tl, tg]);

  return route;
}
