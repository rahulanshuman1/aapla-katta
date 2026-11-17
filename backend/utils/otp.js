const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpSms } = require('./sms');

const TTL = 5 * 60 * 1000;        // a code works for 5 minutes
const COOLDOWN = 30 * 1000;       // at least 30 s between two SMS to the same number
const HOUR = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;           // SMS per number per hour (protects your SMS credit)
const MAX_ATTEMPTS = 5;           // wrong guesses before the code is burnt

class OtpError extends Error {
  constructor(message, status = 400, extra = {}) { super(message); this.status = status; Object.assign(this, extra); }
}

// codes are never stored – only a keyed hash
const hashCode = (phone, code) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret').update(`${phone}:${code}`).digest('hex');
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Creates a 6-digit code, texts it, and remembers it. Throws OtpError (rate limits) or the SMS provider's error. */
async function requestOtp(phone, brand) {
  const now = Date.now();
  const rec = await Otp.findOne({ phone });
  let windowStart = new Date(now), windowCount = 0;
  if (rec) {
    const wait = COOLDOWN - (now - rec.lastSentAt.getTime());
    if (wait > 0) throw new OtpError(`Please wait ${Math.ceil(wait / 1000)} seconds before asking for a new code.`, 429, { retryAfter: Math.ceil(wait / 1000) });
    if (now - rec.windowStart.getTime() < HOUR) {
      if (rec.windowCount >= MAX_PER_HOUR) throw new OtpError('Too many codes requested for this number. Please try again in an hour.', 429);
      windowStart = rec.windowStart; windowCount = rec.windowCount;
    }
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await sendOtpSms(phone, code, brand); // if the SMS fails nothing is saved and no cooldown starts
  await Otp.findOneAndUpdate(
    { phone },
    { phone, codeHash: hashCode(phone, code), expiresAt: new Date(now + TTL), attempts: 0, lastSentAt: new Date(now), windowStart, windowCount: windowCount + 1 },
    { upsert: true, new: true }
  );
}

/** Checks the code. A correct code is single-use. Throws OtpError otherwise. */
async function verifyOtp(phone, code) {
  if (!/^\d{6}$/.test(String(code || ''))) throw new OtpError('Enter the 6-digit code from the SMS.');
  const rec = await Otp.findOne({ phone });
  if (!rec || rec.expiresAt.getTime() < Date.now()) throw new OtpError('This code has expired. Please request a new one.');
  if (rec.attempts >= MAX_ATTEMPTS) throw new OtpError('Too many wrong attempts. Please request a new code.', 429);
  if (!safeEqual(hashCode(phone, String(code)), rec.codeHash)) {
    await Otp.updateOne({ _id: rec._id }, { $inc: { attempts: 1 } });
    const left = MAX_ATTEMPTS - rec.attempts - 1;
    throw new OtpError(left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect code. Please request a new one.');
  }
  // consume atomically so the same code can never be used twice, even by two simultaneous requests
  const del = await Otp.deleteOne({ _id: rec._id, codeHash: rec.codeHash });
  if (del.deletedCount !== 1) throw new OtpError('This code has already been used. Please request a new one.');
}

module.exports = { requestOtp, verifyOtp, OtpError, MAX_ATTEMPTS };
