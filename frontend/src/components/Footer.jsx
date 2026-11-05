import { Link } from 'react-router-dom';
import { useApp } from '../store';
import AnimatedLogo from './AnimatedLogo';
import Editable from './Editable';

export default function Footer() {
  const { settings } = useApp();
  const { contact, brand } = settings;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <AnimatedLogo variant="compact" animateIn={false} />
          <p className="footer-tag">{brand.tagline} · {brand.subtitle}</p>
          <Editable k="footer.text" as="p" className="footer-muted" />
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/menu">Menu</Link>
          <Link to="/#catering">Catering</Link>
          <Link to="/orders">My orders</Link>
          <Link to="/login">Sign in</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>📞 {contact.phone}</a>
          {contact.email && <a href={`mailto:${contact.email}`}>✉️ {contact.email}</a>}
          {contact.instagram && <a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">📸 @{contact.instagram}</a>}
          <span>📍 {contact.address}</span>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} {brand.name}. All rights reserved.</div>
    </footer>
  );
}
