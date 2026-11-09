const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const normalize = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '');
class CouponError extends Error {}

/**
 * Checks a coupon for this user and cart value. Returns { coupon, discount } (discount in whole ₹, applied to the item subtotal)
 * or throws CouponError with a customer-friendly message. The server calls this again when the order is created, so the browser can never fake a discount.
 */
async function evaluateCoupon(rawCode, subtotal, userId) {
  const code = normalize(rawCode);
  if (!code) throw new CouponError('Enter a coupon code');
  const c = await Coupon.findOne({ code });
  if (!c || !c.active) throw new CouponError('This coupon code is not valid');
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) throw new CouponError('This coupon has expired');
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) throw new CouponError('This coupon has been fully redeemed');
  if (c.minOrder > 0 && subtotal < c.minOrder) throw new CouponError(`Add items worth ₹${c.minOrder} or more to use this coupon`);
  if (c.oncePerUser && userId) {
    const used = await Order.countDocuments({ user: userId, couponCode: c.code, status: { $ne: 'cancelled' }, $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod' }, { status: { $ne: 'pending-payment' } }] });
    if (used) throw new CouponError('You have already used this coupon');
  }
  let discount = Math.round((subtotal * c.percent) / 100);
  if (c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
  discount = Math.max(0, Math.min(discount, subtotal));
  return { coupon: c, discount };
}

/** Reserve one use atomically (so a limited coupon cannot be over-used by simultaneous orders). */
async function reserveUse(coupon) {
  const r = await Coupon.updateOne(
    { _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
    { $inc: { usedCount: 1 } }
  );
  return r.modifiedCount === 1;
}

/** Give the use back (order cancelled). Safe to call more than once per order. */
async function releaseUse(order) {
  if (!order.couponCode || order.couponReleased) return;
  const r = await Order.updateOne({ _id: order._id, couponReleased: { $ne: true } }, { couponReleased: true });
  if (r.modifiedCount) await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

module.exports = { evaluateCoupon, reserveUse, releaseUse, normalize, CouponError };
