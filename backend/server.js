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

const origins = (process.env.CLIENT_URL || 'https://aapla-katta.vercel.app').split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({
  origin: (origin, cb) => (!origin || origins.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
}));
app.use(express.json({ limit: '5mb' })); // logos / item photos are sent as compressed data URLs

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));

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

const PORT = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    await ensureAdmin();
    if ((await Category.countDocuments()) === 0) {
      console.log('Empty menu – seeding Aapla Katta menu…');
      await require('./seed/seed').run();
    }
    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  })
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
