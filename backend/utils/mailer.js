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
    });
  }
  return smtp;
}

async function viaBrevo({ to, subject, html }) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
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
    body: JSON.stringify({ from: `${fromName()} <${fromEmail()}>`, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

async function viaSmtp({ to, subject, html }) {
  await smtpTransport().sendMail({ from: `"${fromName()}" <${fromEmail()}>`, to, subject, html });
}

/** Sends an email. Never throws – returns true/false so a mail outage can't break a signup or an order. */
async function sendMail(msg) {
  try {
    if (!msg.to) return false;
    if (process.env.BREVO_API_KEY) await viaBrevo(msg);
    else if (process.env.RESEND_API_KEY) await viaResend(msg);
    else if (process.env.SMTP_HOST && process.env.SMTP_USER) await viaSmtp(msg);
    else {
      console.warn(`[mail] No provider configured. Would send "${msg.subject}" to ${msg.to}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mail] failed:', err.message);
    return false;
  }
}

module.exports = { sendMail };
