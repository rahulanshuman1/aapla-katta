const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const { sendStatusEmail, sendAssignedEmail } = require('../utils/emailTemplates');
const { validLatLng, num } = require('../utils/geo');

const ACTIVE = ['placed', 'confirmed', 'preparing', 'ready', 'out-for-delivery'];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const riderOnly = (req, res, next) =>
  req.user && (req.user.role === 'delivery' || req.user.role === 'admin') ? next() : res.status(403).json({ message: 'Delivery partners only' });

/* ======================= ADMIN: manage delivery team ======================= */
router.get('/partners', protect, adminOnly, async (_req, res) => {
  const partners = await User.find({ role: 'delivery' }).sort({ createdAt: -1 });
  const counts = await Order.aggregate([
    { $match: { 'delivery.partner': { $in: partners.map((p) => p._id) }, status: { $in: ACTIVE } } },
    { $group: { _id: '$delivery.partner', n: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ partners: partners.map((p) => ({ id: p._id, name: p.name, email: p.email, phone: p.phone, activeOrders: byId[String(p._id)] || 0 })) });
});

router.post('/partners', protect, adminOnly, async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ message: 'Name, email, phone and password are required' });
  if (!emailRe.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
  if (String(phone).replace(/\D/g, '').length < 10) return res.status(400).json({ message: 'Enter a valid phone number' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });
  const u = await User.create({ name, email, phone, role: 'delivery', emailVerified: true, passwordHash: await User.hash(password) });
  res.status(201).json({ partner: { id: u._id, name: u.name, email: u.email, phone: u.phone, activeOrders: 0 } });
});

router.put('/partners/:id/password', protect, adminOnly, async (req, res) => {
  if (!req.body.password || req.body.password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  const u = await User.findOne({ _id: req.params.id, role: 'delivery' });
  if (!u) return res.status(404).json({ message: 'Not found' });
  u.passwordHash = await User.hash(req.body.password); await u.save();
  res.json({ ok: true });
});

router.delete('/partners/:id', protect, adminOnly, async (req, res) => {
  const u = await User.findOne({ _id: req.params.id, role: 'delivery' });
  if (!u) return res.status(404).json({ message: 'Not found' });
  if (await Order.exists({ 'delivery.partner': u._id, status: { $in: ACTIVE } })) return res.status(400).json({ message: 'This partner still has active deliveries' });
  await u.deleteOne();
  res.json({ ok: true });
});

/* ======================= ADMIN: assign a rider to an order ======================= */
router.put('/orders/:id/assign', protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.orderType !== 'delivery') return res.status(404).json({ message: 'Delivery order not found' });
  if (['pending-payment', 'cancelled', 'completed'].includes(order.status)) return res.status(400).json({ message: `Cannot assign a rider to a ${order.status} order` });
  if (order.status === 'out-for-delivery') return res.status(400).json({ message: 'This order is already out for delivery' });

  if (!req.body.partnerId) { // un-assign
    order.delivery.partner = undefined; order.delivery.name = undefined; order.delivery.phone = undefined; order.delivery.assignedAt = undefined;
    await order.save();
    return res.json({ order });
  }
  const partner = await User.findOne({ _id: req.body.partnerId, role: 'delivery' });
  if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });
  order.delivery.partner = partner._id; order.delivery.name = partner.name; order.delivery.phone = partner.phone; order.delivery.assignedAt = new Date();
  await order.save();
  sendAssignedEmail(order).catch((e) => console.error('[assign-email]', e.message)); // background
  res.json({ order });
});

/* ======================= RIDER: my deliveries ======================= */
router.get('/my', protect, riderOnly, async (req, res) => {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const orders = await Order.find({
    'delivery.partner': req.user._id,
    $or: [{ status: { $in: ACTIVE } }, { status: 'completed', 'delivery.deliveredAt': { $gte: since } }],
  }).sort({ createdAt: -1 });
  res.json({ orders });
});

router.post('/orders/:id/start', protect, riderOnly, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, 'delivery.partner': req.user._id, orderType: 'delivery' });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!['placed', 'confirmed', 'preparing', 'ready'].includes(order.status)) return res.status(400).json({ message: `Cannot start a ${order.status} order` });
  order.status = 'out-for-delivery';
  order.delivery.startedAt = new Date();
  if (validLatLng(req.body)) order.delivery.location = { lat: num(req.body.lat), lng: num(req.body.lng), at: new Date() };
  await order.save();
  sendStatusEmail(order).catch((e) => console.error('[status-email]', e.message));
  res.json({ order });
});

router.post('/orders/:id/deliver', protect, riderOnly, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, 'delivery.partner': req.user._id, orderType: 'delivery' });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'out-for-delivery') return res.status(400).json({ message: 'Start the delivery first' });
  order.status = 'completed';
  order.delivery.deliveredAt = new Date();
  if (order.paymentMethod === 'cod') order.paymentStatus = 'paid'; // cash collected by the rider
  await order.save();
  sendStatusEmail(order).catch((e) => console.error('[status-email]', e.message));
  res.json({ order });
});

// Rider's phone posts its GPS fix every few seconds – applies to all of this rider's orders that are on the road
router.post('/location', protect, riderOnly, async (req, res) => {
  if (!validLatLng(req.body)) return res.status(400).json({ message: 'Invalid location' });
  const f = (v) => (Number.isFinite(num(v)) ? num(v) : undefined);
  const r = await Order.updateMany(
    { 'delivery.partner': req.user._id, status: 'out-for-delivery' },
    { $set: { 'delivery.location': { lat: num(req.body.lat), lng: num(req.body.lng), heading: f(req.body.heading), speed: f(req.body.speed), accuracy: f(req.body.accuracy), at: new Date() } } }
  );
  res.json({ ok: true, updated: r.modifiedCount });
});

module.exports = router;
