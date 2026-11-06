const { sendMail } = require('./mailer');
const { getSettings } = require('./settings');

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

function layout(s, title, body) {
  const c = s.theme.colors;
  return `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:Segoe UI,Arial,sans-serif;color:${c.text}">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
   <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08)">
    <tr><td style="background:${c.primary};padding:26px 28px;text-align:center">
      <div style="font-size:30px;font-weight:800;color:#fff;letter-spacing:.5px">${esc(s.brand.marathiName)}</div>
      <div style="color:${c.secondary};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-top:4px">${esc(s.brand.tagline)} · ${esc(s.brand.subtitle)}</div>
    </td></tr>
    <tr><td style="padding:30px 28px">
      <h2 style="margin:0 0 14px;font-size:22px;color:${c.primary}">${title}</h2>
      ${body}
    </td></tr>
    <tr><td style="background:#faf5ea;padding:18px 28px;text-align:center;font-size:12px;color:#7a6a60">
      ${esc(s.contact.address)}<br/>📞 ${esc(s.contact.phone)} ${s.contact.instagram ? ' · 📸 @' + esc(s.contact.instagram) : ''}
    </td></tr>
   </table>
  </td></tr></table></body></html>`;
}

const button = (s, href, label) =>
  `<p style="text-align:center;margin:26px 0"><a href="${href}" style="background:${s.theme.colors.primary};color:#fff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;display:inline-block">${label}</a></p>`;

async function sendVerificationEmail(user, token) {
  const s = await getSettings();
  const link = `${process.env.CLIENT_URL.split(',')[0].trim()}/verify-email?token=${token}`;
  return sendMail({
    to: user.email,
    subject: `Verify your email – ${s.brand.name}`,
    html: layout(s, `Hi ${esc(user.name)}, please verify your email`,
      `<p>Thanks for signing up! Tap the button below to verify your email address and activate your account.</p>
       ${button(s, link, 'Verify my email')}
       <p style="font-size:13px;color:#7a6a60">This link is valid for 24 hours. If the button doesn't work, copy this link:<br/><span style="word-break:break-all">${link}</span></p>`),
  });
}

async function sendWelcomeEmail(user) {
  const s = await getSettings();
  const base = process.env.CLIENT_URL.split(',')[0].trim();
  return sendMail({
    to: user.email,
    subject: `Welcome to ${s.brand.name}! 🎉`,
    html: layout(s, `Welcome, ${esc(user.name)}!`,
      `<p>Your email is verified and your account is ready. We're delighted to have you at <b>${esc(s.brand.name)}</b> – ${esc(s.brand.tagline)}!</p>
       <p>Browse our menu, add your favourites and order for dine-in, takeaway or delivery in a few taps.</p>
       ${button(s, base + '/menu', 'Explore the menu')}
       <p style="font-size:13px;color:#7a6a60">Hosting a party? We take catering orders for 100–150 guests – call us on ${esc(s.contact.phone)}.</p>`),
  });
}

async function sendResetEmail(user, token) {
  const s = await getSettings();
  const link = `${process.env.CLIENT_URL.split(',')[0].trim()}/reset-password?token=${token}`;
  return sendMail({
    to: user.email,
    subject: `Reset your password – ${s.brand.name}`,
    html: layout(s, 'Reset your password',
      `<p>We received a request to reset your password. This link is valid for 1 hour.</p>${button(s, link, 'Choose a new password')}
       <p style="font-size:13px;color:#7a6a60">If you didn't ask for this, you can safely ignore this email.</p>`),
  });
}

function orderTable(s, order) {
  const rows = order.items.map((i) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}${i.variant ? ` <span style="color:#7a6a60">(${esc(i.variant)})</span>` : ''} × ${i.qty}</td>
     <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${inr(i.price * i.qty)}</td></tr>`).join('');
  const line = (l, v, bold) => `<tr><td style="padding:5px 0;${bold ? 'font-weight:800;font-size:17px;color:' + s.theme.colors.primary : ''}">${l}</td><td style="padding:5px 0;text-align:right;${bold ? 'font-weight:800;font-size:17px;color:' + s.theme.colors.primary : ''}">${v}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
    ${line('Subtotal', inr(order.subtotal))}
    ${order.gst ? line('GST', inr(order.gst)) : ''}
    ${order.deliveryFee ? line('Delivery fee', inr(order.deliveryFee)) : ''}
    ${line('Total', inr(order.total), true)}</table>`;
}

const typeLabel = { 'dine-in': 'Dine-in', takeaway: 'Takeaway', delivery: 'Home delivery' };

async function sendOrderEmails(order) {
  const s = await getSettings();
  const base = process.env.CLIENT_URL.split(',')[0].trim();
  const pay = order.paymentMethod === 'online'
    ? (order.paymentStatus === 'paid' ? `Paid online ✅ (Ref: ${esc(order.razorpayPaymentId || '')})` : 'Online – pending')
    : 'Pay at restaurant / on delivery';
  const meta = `<p style="font-size:14px;line-height:1.7;margin:16px 0 0">
      <b>Order type:</b> ${typeLabel[order.orderType]}${order.tableNo ? ' · Table ' + esc(order.tableNo) : ''}<br/>
      ${order.address ? `<b>Address:</b> ${esc(order.address)}<br/>` : ''}
      <b>Payment:</b> ${pay}<br/>
      ${order.notes ? `<b>Notes:</b> ${esc(order.notes)}<br/>` : ''}</p>`;

  const customer = sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNo} confirmed – ${s.brand.name}`,
    html: layout(s, `Thank you, ${esc(order.customerName)}! Your order is in 🍽️`,
      `<p>Order <b>#${order.orderNo}</b> has been received. Please allow a minimum of 20 minutes to serve your order.</p>
       ${orderTable(s, order)}${meta}
       ${button(s, base + '/orders', 'Track my order')}`),
  });

  const adminTo = process.env.ORDER_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || s.contact.email;
  const admin = sendMail({
    to: adminTo,
    subject: `🔔 New order ${order.orderNo} – ${inr(order.total)} (${typeLabel[order.orderType]})`,
    html: layout(s, `New order #${order.orderNo}`,
      `<p><b>${esc(order.customerName)}</b> · ${esc(order.phone)} · ${esc(order.customerEmail)}</p>${orderTable(s, order)}${meta}
       ${button(s, base + '/admin', 'Open admin panel')}`),
  });
  const [c, a] = await Promise.all([customer, admin]);
  console.log(`[order ${order.orderNo}] emails -> customer: ${c ? 'sent' : 'FAILED'}, owner: ${a ? 'sent' : 'FAILED'}`);
  return { customer: c, admin: a };
}

async function sendStatusEmail(order) {
  const s = await getSettings();
  const msg = {
    confirmed: 'Your order has been confirmed by the kitchen.',
    preparing: 'Your food is being freshly prepared 👨‍🍳',
    ready: order.orderType === 'delivery' ? 'Your order is out for delivery 🛵' : 'Your order is ready! 🎉',
    completed: 'Your order is complete. Thank you for dining with us – see you again soon!',
    cancelled: 'Your order was cancelled. If you paid online, the refund will be processed by the restaurant. Call us for help.',
  }[order.status];
  if (!msg) return;
  await sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNo}: ${order.status}`,
    html: layout(s, `Order #${order.orderNo} update`, `<p style="font-size:16px">${msg}</p>`),
  });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendResetEmail, sendOrderEmails, sendStatusEmail };
