// Indian mobile numbers only. Accepts 9876543210, 09876543210, 919876543210, +91 98765 43210 … → "+919876543210"
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}
const maskPhone = (e164) => (e164 ? `+91 ${e164.slice(3, 5)}XXXXX${e164.slice(-3)}` : '');
module.exports = { normalizePhone, maskPhone };
