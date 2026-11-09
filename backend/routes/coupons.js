const router = require('express').Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');
const { evaluateCoupon, normalize, CouponError } = require('../utils/coupons');

// Customer: check a code against the cart value (preview only – the order re-checks it)
router.post('/validate', protect, async (req, res) => {
  try {
    const subtotal = Math.max(0, Number(req.body.subtotal) || 0);
    const { coupon, discount } = await evaluateCoupon(req.body.code, subtotal, req.user._id);
    res.json({ valid: true, code: coupon.code, percent: coupon.percent, discount, message: `${coupon.code} applied – ${coupon.percent}% off${coupon.maxDiscount ? ` (up to ₹${coupon.maxDiscount})` : ''}` });
  } catch (e) {
    if (e instanceof CouponError) return res.status(400).json({ valid: false, message: e.message });
    console.error(e); res.status(500).json({ message: 'Could not check the coupon' });
  }
});

// ---- Admin ----
const clean = (b) => {
  const out = {
    code: normalize(b.code),
    percent: Math.round(Number(b.percent)),
    active: b.active !== false,
    description: String(b.description || '').slice(0, 120),
    maxDiscount: Math.max(0, Math.round(Number(b.maxDiscount) || 0)),
    minOrder: Math.max(0, Math.round(Number(b.minOrder) || 0)),
    usageLimit: Math.max(0, Math.round(Number(b.usageLimit) || 0)),
    oncePerUser: !!b.oncePerUser,
  };
  out.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
  return out;
};
const problem = (d) => {
  if (!/^[A-Z0-9_-]{3,20}$/.test(d.code)) return 'Code must be 3–20 letters/numbers (no spaces), e.g. DIWALI10';
  if (!(d.percent >= 1 && d.percent <= 100)) return 'Discount % must be between 1 and 100';
  if (d.expiresAt && Number.isNaN(d.expiresAt.getTime())) return 'Invalid expiry date';
  return null;
};

router.get('/', protect, adminOnly, async (_req, res) => res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) }));

router.post('/', protect, adminOnly, async (req, res) => {
  const d = clean(req.body);
  const p = problem(d); if (p) return res.status(400).json({ message: p });
  if (await Coupon.exists({ code: d.code })) return res.status(400).json({ message: 'A coupon with this code already exists' });
  res.status(201).json({ coupon: await Coupon.create(d) });
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const d = clean(req.body);
  const p = problem(d); if (p) return res.status(400).json({ message: p });
  if (await Coupon.exists({ code: d.code, _id: { $ne: req.params.id } })) return res.status(400).json({ message: 'A coupon with this code already exists' });
  const c = await Coupon.findByIdAndUpdate(req.params.id, d, { new: true });
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json({ coupon: c });
});

router.delete('/:id', protect, adminOnly, async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

module.exports = router;
