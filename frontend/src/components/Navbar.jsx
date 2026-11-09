import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store';
import AnimatedLogo from './AnimatedLogo';

export default function Navbar() {
  const { user, logout, isAdmin, isDelivery, cartCount, setCartOpen, activeTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const close = () => { setOpen(false); setMenuOpen(false); };
  const banner = activeTheme.banner;

  return (
    <header className={`nav-wrap ${scrolled ? 'scrolled' : ''}`}>
      {banner?.enabled && banner.text && (
        <div className="festival-banner">
          <div className="festival-track"><span>{banner.text}</span><span aria-hidden="true">{banner.text}</span><span aria-hidden="true">{banner.text}</span></div>
        </div>
      )}
      <nav className="nav container">
        <Link to="/" className="nav-logo" onClick={close} aria-label="Aapla Katta home"><AnimatedLogo variant="compact" /></Link>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/menu" onClick={close}>Menu</NavLink>
          <Link to="/#catering" onClick={close}>Catering</Link>
          <Link to="/#visit" onClick={close}>Visit us</Link>
          {user && !isDelivery && <NavLink to="/orders" onClick={close}>My orders</NavLink>}
          {isDelivery && <NavLink to="/delivery" onClick={close}>🛵 My deliveries</NavLink>}
          {isAdmin && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
        </div>

        <div className="nav-actions">
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
            🛒
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span key={cartCount} className="cart-badge" initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{cartCount}</motion.span>
              )}
            </AnimatePresence>
          </button>

          {user ? (
            <div className="user-menu">
              <button className="avatar" onClick={() => setMenuOpen(!menuOpen)} aria-label="Account menu">{user.name?.[0]?.toUpperCase()}</button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div className="dropdown" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="dropdown-head"><b>{user.name}</b><small>{user.email}</small></div>
                    {isDelivery ? <Link to="/delivery" onClick={close}>🛵 My deliveries</Link> : <Link to="/orders" onClick={close}>📦 My orders</Link>}
                    <Link to="/account" onClick={close}>👤 My account</Link>
                    {isAdmin && <Link to="/admin" onClick={close}>⚙️ Admin panel</Link>}
                    <button onClick={() => { logout(); close(); nav('/'); }}>🚪 Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary" onClick={close}>Sign in</Link>
          )}
          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">{open ? '✕' : '☰'}</button>
        </div>
      </nav>
    </header>
  );
}
