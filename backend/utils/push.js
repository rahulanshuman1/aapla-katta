// Push notifications to the mobile apps through Firebase Cloud Messaging (Android + iOS).
// Completely optional: if FIREBASE_SERVICE_ACCOUNT is not set every function is a silent no-op.
const User = require('../models/User');

let fb = null;
let state; // undefined = not tried, true/false after init

function init() {
  if (state !== undefined) return state;
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return (state = false);
  try {
    const json = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')); // plain JSON or base64 of it
    fb = require('firebase-admin');
    fb.initializeApp({ credential: fb.credential.cert(json) });
    console.log('[push] Firebase initialised');
    state = true;
  } catch (e) {
    console.error('[push] Firebase init failed – push disabled:', e.message);
    state = false;
  }
  return state;
}

const DEAD = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);

/** Send a notification to every device of the given user ids. Never throws. */
async function pushToUsers(userIds, { title, body, url = '/' }) {
  try {
    if (!init()) return;
    const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
    if (!ids.length) return;
    const users = await User.find({ _id: { $in: ids } }).select('pushTokens');
    const tokens = users.flatMap((u) => (u.pushTokens || []).map((t) => t.token));
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const res = await fb.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { url: String(url) },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      const dead = chunk.filter((_, n) => !res.responses[n].success && DEAD.has(res.responses[n].error?.code));
      if (dead.length) await User.updateMany({}, { $pull: { pushTokens: { token: { $in: dead } } } });
    }
  } catch (e) {
    console.error('[push] failed:', e.message);
  }
}

const adminIds = async () => (await User.find({ role: 'admin' }).select('_id')).map((u) => u._id);

/** "New order" alert for the restaurant owner(s). */
async function pushNewOrder(order) {
  pushToUsers(await adminIds(), {
    title: '🛎️ New order',
    body: `#${order.orderNo} · ₹${order.total} · ${order.orderType}`,
    url: '/admin',
  });
}

/** Status update for the customer. */
function pushOrderStatus(order) {
  const del = order.orderType === 'delivery';
  const text = {
    confirmed: ['✅ Order confirmed', 'The kitchen has accepted your order.'],
    preparing: ['👨‍🍳 Preparing your food', 'Your order is being cooked fresh.'],
    ready: del ? ['📦 Order packed', 'Your order is packed and waiting for the delivery partner.'] : ['🍽️ Order ready', 'Your order is ready.'],
    'out-for-delivery': ['🛵 On the way!', `${order.delivery?.name || 'Your delivery partner'} is bringing your order. Track it live.`],
    completed: del ? ['🎉 Delivered', 'Enjoy your meal!'] : ['🎉 Order completed', 'Thank you for visiting Aapla Katta!'],
    cancelled: ['Order cancelled', `Your order #${order.orderNo} was cancelled.`],
  }[order.status];
  if (!text) return;
  const url = del && order.trackingId && order.status !== 'cancelled' ? `/track/${order.trackingId}` : '/orders';
  return pushToUsers([order.user], { title: text[0], body: `#${order.orderNo} · ${text[1]}`, url });
}

/** Tell the rider a delivery was assigned to them. */
function pushAssigned(order) {
  return pushToUsers([order.delivery?.partner], { title: '🛵 New delivery assigned', body: `#${order.orderNo} · ${order.address || 'see details'}`, url: '/delivery' });
}

module.exports = { pushToUsers, pushNewOrder, pushOrderStatus, pushAssigned };
