import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from './store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FestivalFX from './components/FestivalFX';
import Splash from './components/Splash';
import Toasts from './components/Toasts';
import EditBar from './components/EditBar';
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import { Login, Register, VerifyEmail, Forgot, Reset } from './pages/Auth';
import Admin from './pages/admin/Admin';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Guard({ children, admin }) {
  const { user, authReady, isAdmin } = useApp();
  const loc = useLocation();
  if (!authReady) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { activeTheme } = useApp();
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith('/admin');
  return (
    <>
      <Splash />
      <ScrollTop />
      <FestivalFX effect={activeTheme.effect} />
      <Navbar />
      <main className="main">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<Forgot />} />
            <Route path="/reset-password" element={<Reset />} />
            <Route path="/checkout" element={<Guard><Checkout /></Guard>} />
            <Route path="/orders" element={<Guard><MyOrders /></Guard>} />
            <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdminPage && <Footer />}
      <CartDrawer />
      <EditBar />
      <Toasts />
    </>
  );
}
