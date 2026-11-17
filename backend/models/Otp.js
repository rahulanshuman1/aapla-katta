const mongoose = require('mongoose');

// One live code per phone number. MongoDB deletes expired rows automatically (TTL index on expiresAt).
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },   // +919876543210
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  attempts: { type: Number, default: 0 },                   // wrong guesses so far
  lastSentAt: { type: Date, default: Date.now },
  windowStart: { type: Date, default: Date.now },           // start of the current 1-hour sending window
  windowCount: { type: Number, default: 0 },                // codes sent in that window
});

module.exports = mongoose.model('Otp', otpSchema);
