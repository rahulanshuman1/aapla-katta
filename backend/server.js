require('dotenv').config();
require('./utils/asyncErrors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, ''));
const NATIVE_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost', 'ionic://localhost'];
app.use(cors({
  origin: (origin, cb) => {
    // the mobile apps run inside a WebView whose origin is https://localhost (Android) or capacitor://localhost (iOS)
    if (!origin || origins.includes(origin) || NATIVE_ORIGINS.includes(origin)) return cb(null, true);
    // Don't throw (that prints a huge stack trace) – just log which website was refused and why
    console.warn(`[cors] blocked origin "${origin}". Allowed (CLIENT_URL): ${origins.join(', ')}`);
    cb(null, false);
  },
}));
app.use(express.json({ limit: '12mb' })); // logo / hero / footer / item photos are sent as compressed data URLs

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/track', require('./routes/track'));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (!email || !process.env.ADMIN_PASSWORD) return console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set – no admin created');
  let admin = await User.findOne({ email });
  if (!admin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin', email, role: 'admin', emailVerified: true,
      passwordHash: await User.hash(process.env.ADMIN_PASSWORD),
    });
    console.log('Admin account created:', email);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin'; admin.emailVerified = true; await admin.save();
  }
}

// One-time, safe-to-repeat upgrade for mobile-OTP accounts: the old unique index on "email" must become "sparse"
// (so several phone-only accounts without an email can exist), and existing users get a normalised phone for OTP look-ups.
async function upgradeUsers() {
  try {
    const { normalizePhone } = require('./utils/phone');
    const idx = await User.collection.indexes().catch(() => []);
    const e = idx.find((i) => i.name === 'email_1');
    if (e && !e.sparse) { await User.collection.dropIndex('email_1'); console.log('[db] email index replaced by a sparse one'); }
    await User.createIndexes();
    const todo = await User.find({ phone: { $nin: ['', null] }, phoneNorm: { $exists: false } }).select('phone');
    for (const u of todo) { const n = normalizePhone(u.phone); if (n) await User.updateOne({ _id: u._id }, { phoneNorm: n }); }
  } catch (err) { console.error('[db] user upgrade failed (mobile OTP sign-up may not work):', err.message); }
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    await upgradeUsers();
    await ensureAdmin();
    if ((await Category.countDocuments()) === 0) {
      console.log('Empty menu – seeding Aapla Katta menu…');
      await require('./seed/seed').run();
    }
    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  })
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
