// Order-update SMS for customers who signed up with a mobile number only (they have no email address).
// Customers who have an email keep getting emails. Turn off with ORDER_SMS=off.
const { getSettings } = require('./settings');
const { sendTextSms, smsEnabled, providerName } = require('./sms');
const { normalizePhone } = require('./phone');

const base = () => (process.env.CLIENT_URL || '').split(',')[0].trim();

// Only the moments a customer cares about (each SMS costs money).
function textFor(order, kind, brand) {
  const no = order.orderNo, delivery = order.orderType === 'delivery';
  const track = delivery && order.trackingId ? ` Track: ${base()}/track/${order.trackingId}` : '';
  if (kind === 'placed') return `${brand}: Order #${no} received (Rs ${order.total}). We'll update you here.${track}`;
  if (kind === 'assigned') return `${brand}: ${order.delivery?.name || 'Your delivery partner'} will deliver order #${no}.${track}`;
  switch (order.status) {
    case 'ready': return `${brand}: Order #${no} is ${delivery ? 'packed and waiting for the rider' : 'ready'}.`;
    case 'out-for-delivery': return `${brand}: Order #${no} is on the way!${order.delivery?.name ? ` Rider ${order.delivery.name} ${order.delivery.phone || ''}.` : ''}${track}`;
    case 'completed': return `${brand}: Order #${no} ${delivery ? 'delivered' : 'complete'}. Thank you!`;
    case 'cancelled': return `${brand}: Order #${no} was cancelled. Please call us for help.`;
    default: return null; // confirmed / preparing → no SMS
  }
}

/** kind: 'placed' | 'status' | 'assigned'. Never throws. */
async function orderSms(order, kind) {
  try {
    if (order.customerEmail || process.env.ORDER_SMS === 'off' || !smsEnabled()) return;
    const to = normalizePhone(order.phone);
    if (!to) return;
    const s = await getSettings();
    const text = textFor(order, kind, (s.brand && s.brand.name) || 'Aapla Katta');
    if (!text) return;
    await sendTextSms(to, text);
    console.log(`[order ${order.orderNo}] sms (${kind}) via ${providerName()} -> sent`);
  } catch (e) { console.error(`[order ${order.orderNo}] sms FAILED:`, e.message); }
}

module.exports = { orderSms };
