const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please sign in' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please sign in again' });
  }
}

// Same as protect but does not fail when there is no token
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = await User.findById(payload.id);
    }
  } catch {
    /* ignore */
  }
  next();
}

const adminOnly = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });

module.exports = { sign, protect, optionalAuth, adminOnly };
