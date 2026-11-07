const crypto = require('crypto');

// Tracking IDs look like TRK-7K2M9QX4BH (32-character alphabet without 0/O/1/I, ~50 bits – not guessable)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genTrackingId() {
  let s = '';
  for (const b of crypto.randomBytes(10)) s += ALPHABET[b % ALPHABET.length];
  return `TRK-${s}`;
}

const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
function validLatLng(p) {
  if (!p || typeof p !== 'object') return false;
  const lat = num(p.lat), lng = num(p.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

module.exports = { genTrackingId, validLatLng, num };
