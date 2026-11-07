const router = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');
const { getSettings } = require('../utils/settings');
const { genTrackingId, validLatLng } = require('../utils/geo');
const { sendOrderEmails, sendStatusEmail } = require('../utils/emailTemplates');

let rzp;
const razorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return (rzp ||= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }));
};

// Sends the order emails in the background (never makes the customer wait) and guarantees only one send per order.
function notifyOrder(order) {
  Order.findOneAndUpdate({ _id: order._id, emailsSent: { $ne: true } }, { emailsSent: true }, { new: true })
    .then((claimed) => claimed && sendOrderEmails(claimed))
    .catch((e) => console.error('[order-email] failed:', e.message));
}

const orderNo = () => 'AK' + Date.now().toString(36).toUpperCase().slice(-6) + crypto.randomInt(10, 99);

async function createGatewayOrder(order) {
  const r = await razorpay().orders.create({
    amount: Math.round(order.total * 100),
    currency: 'INR',
    receipt: order.orderNo,
    notes: { orderNo: order.orderNo },
  });
  order.razorpayOrderId = r.id;
  await order.save();
  return { keyId: process.env.RAZORPAY_KEY_ID, razorpayOrderId: r.id, amount: r.amount, currency: r.currency };
}

// Create order – prices are always re-calculated on the server
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user.emailVerified) return res.status(403).json({ message: 'Please verify your email first' });
    const s = await getSettings();
    if (!s.charges.acceptingOrders) return res.status(400).json({ message: 'Sorry, we are not accepting online orders right now.' });

    const { items, orderType = 'dine-in', tableNo = '', address = '', phone, notes = '', paymentMethod = 'online', deliveryLocation } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Your cart is empty' });
    if (!phone || String(phone).replace(/\D/g, '').length < 10) return res.status(400).json({ message: 'Enter a valid phone number' });
    if (orderType === 'delivery' && !address.trim()) return res.status(400).json({ message: 'Delivery address is required' });
    if (paymentMethod === 'cod' && !s.charges.enableCOD) return res.status(400).json({ message: 'Pay-at-restaurant is disabled' });
    if (paymentMethod === 'online' && !razorpay()) return res.status(400).json({ message: 'Online payment is not configured' });

    const dbItems = await MenuItem.find({ _id: { $in: items.map((i) => i.itemId) } });
    const map = new Map(dbItems.map((d) => [String(d._id), d]));
    const lines = [];
    for (const it of items) {
      const d = map.get(String(it.itemId));
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 1), 50);
      if (!d || !d.available) return res.status(400).json({ message: `"${d?.name || 'An item'}" is no longer available` });
      let price = d.price, variant = '';
      if (d.variants?.length) {
        const v = d.variants.find((x) => x.label === it.variant) || d.variants[0];
        price = v.price; variant = v.label;
      }
      lines.push({ item: d._id, name: d.name, variant, price, qty });
    }
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    if (subtotal < s.charges.minOrder) return res.status(400).json({ message: `Minimum order is ₹${s.charges.minOrder}` });
    const gst = Math.round((subtotal * s.charges.gstPercent) / 100);
    const deliveryFee = orderType === 'delivery' ? Number(s.charges.deliveryFee) || 0 : 0;

    const order = await Order.create({
      orderNo: orderNo(), user: req.user._id, customerName: req.user.name, customerEmail: req.user.email, phone,
      items: lines, subtotal, gst, deliveryFee, total: subtotal + gst + deliveryFee,
      orderType, tableNo, address, notes, paymentMethod,
      // Delivery orders get a live-tracking ID the moment they are created
      trackingId: orderType === 'delivery' ? genTrackingId() : undefined,
      deliveryLocation: orderType === 'delivery' && validLatLng(deliveryLocation) ? { lat: Number(deliveryLocation.lat), lng: Number(deliveryLocation.lng) } : undefined,
      paymentStatus: 'pending', status: paymentMethod === 'online' ? 'pending-payment' : 'placed',
    });

    if (paymentMethod === 'cod') {
      notifyOrder(order);
      return res.status(201).json({ order });
    }
    res.status(201).json({ order, payment: await createGatewayOrder(order) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Could not place order' });
  }
});

// Retry payment for an unpaid online order
router.post('/:id/pay', protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order || order.paymentStatus === 'paid' || order.paymentMethod !== 'online' || !razorpay()) return res.status(400).json({ message: 'Cannot pay this order' });
  res.json({ order, payment: await createGatewayOrder(order) });
});

// Verify Razorpay signature, mark paid, send emails
router.post('/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const ok = expected.length === (razorpay_signature || '').length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) {
    order.paymentStatus = 'failed'; await order.save();
    return res.status(400).json({ message: 'Payment verification failed' });
  }
  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid'; order.status = 'placed'; order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
  }
  notifyOrder(order); // background – the response must not wait for email
  res.json({ order });
});

router.get('/mine', protect, async (req, res) => {
  res.json({ orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50) });
});

// ---- Admin ----
router.get('/', protect, adminOnly, async (req, res) => {
  const q = { status: { $ne: 'pending-payment' } };
  if (req.query.status) q.status = req.query.status;
  res.json({ orders: await Order.find(q).sort({ createdAt: -1 }).limit(200) });
});

router.get('/stats', protect, adminOnly, async (_req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = await Order.find({ createdAt: { $gte: start }, status: { $nin: ['pending-payment', 'cancelled'] } });
  const open = await Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] } });
  res.json({ ordersToday: today.length, revenueToday: today.reduce((a, o) => a + o.total, 0), openOrders: open });
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (status === 'out-for-delivery' && !(order.orderType === 'delivery' && order.delivery?.partner)) {
    return res.status(400).json({ message: 'Assign a delivery partner first' });
  }
  order.status = status;
  if (status === 'out-for-delivery' && !order.delivery.startedAt) order.delivery.startedAt = new Date();
  if (status === 'completed' && order.orderType === 'delivery') order.delivery.deliveredAt = order.delivery.deliveredAt || new Date();
  if (status === 'completed' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
  await order.save();
  sendStatusEmail(order);
  res.json({ order });
});

module.exports = router;
