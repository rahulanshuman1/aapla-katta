const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');

// Customers' pages poll this every few seconds, so allow plenty – but not unlimited
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

// Public: anyone holding the (unguessable) tracking ID can follow the order, like a Swiggy/Zomato share link.
// Only safe fields are returned – no customer phone / full address / email.
router.get('/:code', limiter, async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const o = code ? await Order.findOne({ trackingId: code }).lean() : null;
  if (!o) return res.status(404).json({ message: 'Tracking ID not found' });
  const d = o.delivery || {};
  const live = o.status === 'out-for-delivery';
  res.json({
    track: {
      trackingId: o.trackingId,
      orderNo: o.orderNo,
      status: o.status,
      customerName: String(o.customerName || '').split(' ')[0],
      items: (o.items || []).map((i) => ({ name: i.name, variant: i.variant, qty: i.qty })),
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      destination: o.deliveryLocation && o.deliveryLocation.lat != null ? { lat: o.deliveryLocation.lat, lng: o.deliveryLocation.lng } : null,
      rider: d.name ? { name: d.name, phone: d.phone } : null,
      location: live && d.location && d.location.lat != null ? { lat: d.location.lat, lng: d.location.lng, heading: d.location.heading ?? null, at: d.location.at } : null,
      startedAt: d.startedAt || null,
      deliveredAt: d.deliveredAt || null,
    },
  });
});

module.exports = router;
