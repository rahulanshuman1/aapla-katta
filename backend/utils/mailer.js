const nodemailer = require('nodemailer');

const fromName = () => process.env.MAIL_FROM_NAME || 'Aapla Katta';
const fromEmail = () => process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';

let smtp;
function smtpTransport() {
  if (!smtp) {
    const port = Number(process.env.SMTP_PORT || 465);
    smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Never hang: Render's free plan silently blocks SMTP ports, so fail fast instead of waiting minutes
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return smtp;
}

async function viaBrevo({ to, subject, html }) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      sender: { name: fromName(), email: fromEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${await r.text()}`);
}

async function viaResend({ to, subject, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ from: `${fromName()} <${fromEmail()}>`, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

async function viaSmtp({ to, subject, html }) {
  await smtpTransport().sendMail({ from: `"${fromName()}" <${fromEmail()}>`, to, subject, html });
}

function providerName() {
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return 'smtp';
  return null;
}

async function deliver(msg) {
  const provider = providerName();
  if (!provider) throw new Error('No email provider configured (set BREVO_API_KEY on Render)');
  if (provider === 'brevo') await viaBrevo(msg);
  else if (provider === 'resend') await viaResend(msg);
  else await viaSmtp(msg);
  return provider;
}

/** Sends an email. Never throws – returns true/false so a mail outage can't break a signup or an order. */
async function sendMail(msg) {
  try {
    if (!msg.to) return false;
    const provider = await deliver(msg);
    console.log(`[mail] sent via ${provider}: "${msg.subject}" -> ${msg.to}`);
    return true;
  } catch (err) {
    console.error(`[mail] FAILED "${msg.subject}" -> ${msg.to}: ${err.message}`);
    return false;
  }
}

/** Used by the admin "Send test email" button – returns the real error so problems are visible. */
async function sendTestMail(to) {
  try {
    const provider = await deliver({
      to,
      subject: 'Aapla Katta – test email',
      html: '<p>✅ Email sending works. Customers will now receive verification, welcome and order emails.</p>',
    });
    return { ok: true, provider };
  } catch (err) {
    return { ok: false, provider: providerName(), error: err.message };
  }
}

module.exports = { sendMail, sendTestMail };
