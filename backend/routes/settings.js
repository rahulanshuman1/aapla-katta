const router = require('express').Router();
const { getSettings, saveSettings } = require('../utils/settings');
const { protect, adminOnly } = require('../middleware/auth');
const { sendTestMail } = require('../utils/mailer');

router.get('/', async (_req, res) => {
  const settings = await getSettings();
  res.json({
    settings,
    meta: {
      razorpayEnabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
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

module.exports = router;
