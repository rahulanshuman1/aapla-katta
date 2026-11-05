const router = require('express').Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { sign, protect } = require('../middleware/auth');
const { sendVerificationEmail, sendWelcomeEmail, sendResetEmail } = require('../utils/emailTemplates');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function issueVerification(user) {
  const token = crypto.randomBytes(32).toString('hex');
  user.verifyTokenHash = sha(token);
  user.verifyExpires = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  await sendVerificationEmail(user, token);
}

router.post('/register', limiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (!emailRe.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() }).select('+verifyTokenHash');
    if (exists && exists.emailVerified) return res.status(409).json({ message: 'An account with this email already exists' });
    if (exists) { // unverified duplicate: refresh details and resend the email
      exists.name = name; exists.phone = phone || ''; exists.passwordHash = await User.hash(password);
      await issueVerification(exists);
      return res.status(201).json({ message: 'Verification email sent. Please check your inbox.' });
    }
    const user = await User.create({ name, email, phone, passwordHash: await User.hash(password) });
    await issueVerification(user);
    res.status(201).json({ message: 'Account created! Please check your email to verify your address.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Could not create account' });
  }
});

router.post('/verify-email', limiter, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Missing token' });
  const user = await User.findOne({ verifyTokenHash: sha(token), verifyExpires: { $gt: new Date() } }).select('+verifyTokenHash +verifyExpires');
  if (!user) return res.status(400).json({ message: 'This verification link is invalid or has expired' });
  const wasVerified = user.emailVerified;
  user.emailVerified = true; user.verifyTokenHash = undefined; user.verifyExpires = undefined;
  await user.save();
  if (!wasVerified) sendWelcomeEmail(user); // fire and forget
  res.json({ token: sign(user), user: user.toPublic() });
});

router.post('/resend-verification', limiter, async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (user && !user.emailVerified) await issueVerification(user);
  res.json({ message: 'If that account exists and is unverified, a new email has been sent.' });
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ message: 'Incorrect email or password' });
  if (!user.emailVerified) return res.status(403).json({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first. Check your inbox.' });
  res.json({ token: sign(user), user: user.toPublic() });
});

router.post('/forgot-password', limiter, async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha(token);
    user.resetExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();
    await sendResetEmail(user, token);
  }
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

router.post('/reset-password', limiter, async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  const user = await User.findOne({ resetTokenHash: sha(token || ''), resetExpires: { $gt: new Date() } }).select('+resetTokenHash +resetExpires');
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });
  user.passwordHash = await User.hash(password);
  user.resetTokenHash = undefined; user.resetExpires = undefined; user.emailVerified = true;
  await user.save();
  res.json({ message: 'Password updated. You can sign in now.' });
});

router.get('/me', protect, (req, res) => res.json({ user: req.user.toPublic() }));

router.put('/me', protect, async (req, res) => {
  const { name, phone, address } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address !== undefined) req.user.address = address;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

module.exports = router;
