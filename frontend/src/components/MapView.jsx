import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default view = Chinchwad, Pune (used until a pin / rider position is known)
const DEFAULT_CENTER = [18.6298, 73.7997];
const pin = (emoji, cls = '') => L.divIcon({ className: `emoji-pin ${cls}`, html: `<span>${emoji}</span>`, iconSize: [40, 40], iconAnchor: [20, 20] });

/**
 * OpenStreetMap (Leaflet) map – no API key needed.
 *  dest   {lat,lng}  customer's delivery pin (🏠). Draggable when `onPick` is given.
 *  rider  {lat,lng}  delivery partner's live position (🛵), moved smoothly as updates arrive.
 *  origin {lat,lng}  restaurant (🍴), shown on delivery routes.
 *  route  [[lat,lng],...]  road route drawn as a line.
 *  onPick (lat,lng)  makes the map a location picker: tap the map or drag the pin.
 */
export default function MapView({ dest, rider, origin, route, onPick, height = 320 }) {
  const el = useRef(null);
  const map = useRef(null);
  const destM = useRef(null);
  const riderM = useRef(null);
  const originM = useRef(null);
  const line = useRef(null);
  const userMoved = useRef(false);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const picker = !!onPick;

  // create the map once
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true }).setView(DEFAULT_CENTER, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(m);
    m.on('dragstart', () => { userMoved.current = true; });
    m.on('click', (e) => onPickRef.current && onPickRef.current(e.latlng.lat, e.latlng.lng));
    map.current = m;
    const t = setTimeout(() => m.invalidateSize(), 250); // fixes grey tiles when the container was hidden/animating
    return () => { clearTimeout(t); m.remove(); map.current = null; destM.current = null; riderM.current = null; originM.current = null; line.current = null; };
  }, []);

  // keep both markers in view (unless the user has panned the map themselves)
  const frame = useCallback(() => {
    const m = map.current;
    if (!m) return;
    const pts = [];
    if (rider) pts.push([rider.lat, rider.lng]);
    if (dest) pts.push([dest.lat, dest.lng]);
    if (origin && !rider) pts.push([origin.lat, origin.lng]);
    if (!pts.length) return;
    if (picker) { if (!m.getBounds().contains(pts[0])) m.setView(pts[0], 16); return; }
    if (pts.length === 1) m.setView(pts[0], Math.max(m.getZoom(), 16));
    else m.fitBounds(pts, { padding: [60, 60], maxZoom: 17 });
  }, [rider, dest, origin, picker]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (dest) {
      const ll = [dest.lat, dest.lng];
      if (!destM.current) {
        destM.current = L.marker(ll, { icon: pin('🏠', 'dest'), draggable: picker }).addTo(m);
        if (picker) destM.current.on('dragend', (e) => { const p = e.target.getLatLng(); onPickRef.current && onPickRef.current(p.lat, p.lng); });
      } else destM.current.setLatLng(ll);
    } else if (destM.current) { destM.current.remove(); destM.current = null; }

    if (rider) {
      const ll = [rider.lat, rider.lng];
      if (!riderM.current) riderM.current = L.marker(ll, { icon: pin('🛵', 'rider'), zIndexOffset: 500 }).addTo(m);
      else riderM.current.setLatLng(ll);
    } else if (riderM.current) { riderM.current.remove(); riderM.current = null; }

    if (origin) {
      const o = [origin.lat, origin.lng];
      if (!originM.current) originM.current = L.marker(o, { icon: pin('🍴', 'origin') }).addTo(m); else originM.current.setLatLng(o);
    } else if (originM.current) { originM.current.remove(); originM.current = null; }

    if (!userMoved.current) frame();
  }, [dest?.lat, dest?.lng, rider?.lat, rider?.lng, origin?.lat, origin?.lng, picker]); // eslint-disable-line

  // road route line (white casing + coloured line, like delivery apps)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (line.current) { line.current.remove(); line.current = null; }
    if (route && route.length > 1) {
      line.current = L.layerGroup([
        L.polyline(route, { color: '#fff', weight: 9, opacity: 0.9 }),
        L.polyline(route, { color: '#1a73e8', weight: 5, opacity: 0.95 }),
      ]).addTo(m);
      if (!userMoved.current) m.fitBounds(L.latLngBounds(route), { padding: [50, 50], maxZoom: 17 });
    }
  }, [route]);

  return (
    <div className="map-wrap" style={{ height }}>
      <div ref={el} className="map" />
      {!picker && (
        <button type="button" className="map-recenter" onClick={() => { userMoved.current = false; frame(); }}>◎ Recenter</button>
      )}
    </div>
  );
}
