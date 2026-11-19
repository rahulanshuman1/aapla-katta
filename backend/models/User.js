const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizePhone } = require('../utils/phone');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // email is optional: customers who sign up with a mobile OTP only have a phone number (sparse index = many accounts may have no email)
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    phoneNorm: { type: String, index: true },        // +919876543210 – used to find the account when signing in with an OTP
    phoneVerified: { type: Boolean, default: false }, // proved by entering an SMS code
    hasPassword: { type: Boolean, default: true },    // false for accounts created with a mobile OTP
    address: { type: String, trim: true, default: '' },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['customer', 'admin', 'delivery'], default: 'customer' },
    emailVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, select: false },
    verifyExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    pushTokens: { type: [{ _id: false, token: String, platform: String, at: { type: Date, default: Date.now } }], default: [], select: false }, // mobile app devices (FCM)
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  if (this.isModified('phone')) this.phoneNorm = normalizePhone(this.phone) || undefined;
  next();
});

userSchema.methods.comparePassword = function (plain) {
  if (!this.passwordHash) return Promise.resolve(false); // OTP-only account
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.statics.hash = (plain) => bcrypt.hash(plain, 11);
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    address: this.address,
    role: this.role,
    emailVerified: this.emailVerified,
    phoneVerified: this.phoneVerified,
    hasPassword: this.hasPassword !== false,
  };
};

module.exports = mongoose.model('User', userSchema);
