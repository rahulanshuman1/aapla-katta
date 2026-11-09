import { Link } from 'react-router-dom';
import { useApp } from '../store';

const UPDATED = '9 November 2026';

function Page({ title, children }) {
  return (
    <div className="container narrow page-pad legal">
      <h1 className="page-title">{title}</h1>
      <p className="muted small">Last updated: {UPDATED}</p>
      {children}
      <p className="center" style={{ marginTop: 28 }}><Link to="/" className="link-btn">← Back to home</Link></p>
    </div>
  );
}

export function Privacy() {
  const { settings } = useApp();
  const n = settings.brand.name; const c = settings.contact;
  return (
    <Page title="Privacy Policy">
      <p>{n} ("we", "us") runs this website and mobile app so you can order food from our restaurant at {c.address}. This policy explains what information we collect and how we use it.</p>
      <h3>Information we collect</h3>
      <ul>
        <li><b>Account details:</b> your name, email address, mobile number and password (stored encrypted – we cannot read it).</li>
        <li><b>Order details:</b> items ordered, order type (dine-in, takeaway, delivery), table number, delivery address, notes and payment status.</li>
        <li><b>Delivery location:</b> if you choose Delivery, the map pin you place (or your phone's location if you tap "Use my current location").</li>
        <li><b>Delivery partners only:</b> the live location of the delivery partner's phone while a delivery is in progress, so the customer can track the order.</li>
        <li><b>Device token:</b> in the mobile app, an identifier used to send you order notifications.</li>
      </ul>
      <p>We do <b>not</b> collect or store your card, UPI or bank details. Payments are handled by Razorpay on their secure page.</p>
      <h3>How we use it</h3>
      <ul>
        <li>To take, prepare and deliver your orders and show you live tracking.</li>
        <li>To email you your verification link, order confirmations and status updates, and to send app notifications about your order.</li>
        <li>To keep accounting records and prevent fraud.</li>
      </ul>
      <p>We do not sell your personal information and we do not send marketing messages without your consent.</p>
      <h3>Who we share it with</h3>
      <ul>
        <li><b>Razorpay</b> – to process online payments.</li>
        <li><b>Email provider (Brevo)</b> – to deliver our emails to you.</li>
        <li><b>Firebase Cloud Messaging (Google)</b> – to deliver app notifications.</li>
        <li><b>OpenStreetMap / OSRM</b> – map tiles and route calculation for tracking (they receive map coordinates, not your name or contact details).</li>
        <li><b>Our delivery partner</b> – your name, phone number and delivery address for the order they are delivering.</li>
      </ul>
      <h3>Retention and your choices</h3>
      <p>We keep your account until you delete it. You can edit your details or <Link to="/account">delete your account</Link> at any time from the app or website (My account). When you delete your account we remove your personal details from your past orders; we keep the order amounts for accounting.</p>
      <p>Location access is optional and you can turn it off in your phone settings; delivery pins can also be skipped (live arrival time will not be shown).</p>
      <h3>Security</h3>
      <p>Data is sent over encrypted connections (HTTPS) and stored in a protected database. No method is perfectly secure, but we take reasonable steps to protect your information.</p>
      <h3>Children</h3>
      <p>This service is not directed at children under 13 and we do not knowingly collect their information.</p>
      <h3>Contact us</h3>
      <p>Questions or requests about your data: {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}{c.email ? ' or ' : ''}call <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>.</p>
    </Page>
  );
}

export function Terms() {
  const { settings } = useApp();
  const n = settings.brand.name; const c = settings.contact;
  return (
    <Page title="Terms of Use">
      <p>By using the {n} website or app you agree to these terms.</p>
      <h3>Ordering</h3>
      <ul>
        <li>Prices are shown in Indian Rupees and may change without notice. The price charged is the one shown at checkout.</li>
        <li>We may pause online orders or refuse an order at busy times or when an item is unavailable. If we cancel a paid order you will be refunded to the original payment method.</li>
        <li>Delivery times and arrival estimates are approximate and depend on traffic and weather.</li>
      </ul>
      <h3>Payments</h3>
      <p>Online payments are processed securely by Razorpay (UPI, cards, netbanking). You can also choose to pay at the restaurant / cash on delivery where offered.</p>
      <h3>Cancellations and refunds</h3>
      <p>Food is prepared fresh, so orders can only be cancelled before preparation begins – please call us on <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> immediately. Refunds for cancelled or failed payments are returned to the original payment method, usually within 5–7 working days.</p>
      <h3>Your account</h3>
      <p>Keep your password private. You are responsible for activity on your account. You can delete your account any time from <Link to="/account">My account</Link>.</p>
      <h3>Acceptable use</h3>
      <p>Please do not misuse the service, place fake orders or attempt to disrupt it.</p>
      <h3>Contact</h3>
      <p>{n}, {c.address}. Phone <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>.</p>
    </Page>
  );
}
