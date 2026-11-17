// Sends an SMS through whichever provider is configured in the environment (Render → Environment).
//
//   Brevo    : BREVO_API_KEY (same key as email) + BREVO_SMS_SENDER (max 11 letters/digits, e.g. AAPLAK). Needs SMS credits in Brevo.
//   Twilio   : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and (TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID)
//   Fast2SMS : FAST2SMS_API_KEY            (FAST2SMS_ROUTE = otp (default) | q)
//   2Factor  : TWOFACTOR_API_KEY           (optional TWOFACTOR_TEMPLATE)
//   log      : SMS_PROVIDER=log  → nothing is sent, the code is printed in the server log (testing only)
//
// SMS_PROVIDER can force one of: brevo | twilio | fast2sms | 2factor | log. Otherwise the first configured provider is used.
// With nothing configured, mobile-OTP login is switched off (the website hides the option).

const need = (v, name) => { if (!v) throw new Error(`${name} is not set`); return v; };
const digits10 = (e164) => e164.replace(/\D/g, '').slice(-10);

async function parse(r, who) {
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
  if (!r.ok) throw new Error(`${who} ${r.status}: ${(json && (json.message || json.Details || json.error)) || text.slice(0, 200)}`);
  return json || {};
}

const providers = {
  async brevo(to, text) {
    const key = need(process.env.BREVO_API_KEY, 'BREVO_API_KEY');
    const sender = need(process.env.BREVO_SMS_SENDER, 'BREVO_SMS_SENDER').replace(/[^A-Za-z0-9]/g, '').slice(0, 11);
    const body = JSON.stringify({ sender, recipient: to.replace(/\D/g, ''), content: text, type: 'transactional' });
    const call = (path) => fetch(`https://api.brevo.com/v3/transactionalSMS/${path}`, {
      method: 'POST', headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' }, body, signal: AbortSignal.timeout(15000),
    });
    let r = await call('send');
    if (r.status === 404) r = await call('sms'); // older endpoint name
    await parse(r, 'Brevo SMS');
  },

  async twilio(to, text) {
    const sid = need(process.env.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID');
    const token = need(process.env.TWILIO_AUTH_TOKEN, 'TWILIO_AUTH_TOKEN');
    const body = new URLSearchParams({ To: to, Body: text });
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) body.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
    else body.set('From', need(process.env.TWILIO_FROM, 'TWILIO_FROM'));
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
      body, signal: AbortSignal.timeout(15000),
    });
    await parse(r, 'Twilio');
  },

  async fast2sms(to, text, code) {
    const key = need(process.env.FAST2SMS_API_KEY, 'FAST2SMS_API_KEY');
    const route = process.env.FAST2SMS_ROUTE || 'otp';
    const payload = route === 'otp' ? { route: 'otp', variables_values: code, numbers: digits10(to) } : { route, message: text, numbers: digits10(to) };
    const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST', headers: { authorization: key, 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
    const j = await parse(r, 'Fast2SMS');
    if (j.return === false) throw new Error(`Fast2SMS: ${j.message || 'rejected'}`);
  },

  async '2factor'(to, _text, code) {
    const key = need(process.env.TWOFACTOR_API_KEY, 'TWOFACTOR_API_KEY');
    const tpl = process.env.TWOFACTOR_TEMPLATE ? `/${encodeURIComponent(process.env.TWOFACTOR_TEMPLATE)}` : '';
    const r = await fetch(`https://2factor.in/API/V1/${key}/SMS/${digits10(to)}/${code}${tpl}`, { signal: AbortSignal.timeout(15000) });
    const j = await parse(r, '2Factor');
    if (j.Status && j.Status !== 'Success') throw new Error(`2Factor: ${j.Details || j.Status}`);
  },

  async log(to, text) { console.log(`[sms:log] to ${to}: ${text}`); },
};

function providerName() {
  const forced = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  if (forced) return providers[forced] ? forced : null;
  if (process.env.BREVO_API_KEY && process.env.BREVO_SMS_SENDER) return 'brevo'; // the sender name is what switches Brevo SMS on (BREVO_API_KEY alone is just email)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';
  if (process.env.FAST2SMS_API_KEY) return 'fast2sms';
  if (process.env.TWOFACTOR_API_KEY) return '2factor';
  return null;
}
const smsEnabled = () => !!providerName();

/** Sends the one-time code. Throws with the provider's real error message when it fails. */
async function sendOtpSms(toE164, code, brand = 'Aapla Katta') {
  const name = providerName();
  if (!name) throw new Error('No SMS provider is configured');
  const text = `${code} is your ${brand} login OTP. Valid for 5 minutes. Do not share it with anyone.`;
  await providers[name](toE164, text, code);
  return name;
}

module.exports = { sendOtpSms, smsEnabled, providerName };
