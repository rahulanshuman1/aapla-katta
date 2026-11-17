const router = require('express').Router();
const { getSettings, saveSettings } = require('../utils/settings');
const { protect, adminOnly } = require('../middleware/auth');
const { sendTestMail } = require('../utils/mailer');
const { sendOtpSms, smsEnabled, providerName } = require('../utils/sms');
const { normalizePhone } = require('../utils/phone');

router.get('/', async (_req, res) => {
  const settings = await getSettings();
  res.json({
    settings,
    meta: {
      razorpayEnabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      otpEnabled: smsEnabled(), // mobile-OTP sign-in is shown only when an SMS provider is configured
    },
  });
});

// Partial update of any section (brand / theme / contact / charges / content)
router.put('/', protect, adminOnly, async (req, res) => {
  const allowed = ['brand', 'theme', 'contact', 'charges', 'content'];
  const patch = {};
  allowed.forEach((k) => req.body[k] !== undefined && (patch[k] = req.body[k]));
  res.json({ settings: await saveSettings(patch) });
});

// Admin: send a test email to yourself to confirm the mail provider works
router.post('/test-email', protect, adminOnly, async (req, res) => {
  res.json(await sendTestMail(req.user.email));
});

// Admin: send a test SMS to a number to confirm the SMS provider works (returns the real provider error)
router.post('/test-sms', protect, adminOnly, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit Indian mobile number' });
  if (!smsEnabled()) return res.json({ ok: false, error: 'No SMS provider is configured. Set TWILIO_*, FAST2SMS_API_KEY or TWOFACTOR_API_KEY (or SMS_PROVIDER=log) on Render.' });
  try { res.json({ ok: true, provider: await sendOtpSms(phone, '123456', 'Aapla Katta (test)'), to: phone }); }
  catch (e) { res.json({ ok: false, provider: providerName(), error: e.message }); }
});

module.exports = router;
