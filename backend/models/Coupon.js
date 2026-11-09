const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percent: { type: Number, required: true, min: 1, max: 100 },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
    maxDiscount: { type: Number, default: 0 },   // ₹ cap on the discount, 0 = no cap
    minOrder: { type: Number, default: 0 },      // minimum cart value (₹) to use it, 0 = none
    expiresAt: { type: Date },                   // last moment it works, empty = never expires
    usageLimit: { type: Number, default: 0 },    // total times it can be used, 0 = unlimited
    usedCount: { type: Number, default: 0 },
    oncePerUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
