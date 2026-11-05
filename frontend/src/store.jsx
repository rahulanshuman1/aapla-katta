import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api';
import { CONTENT } from './defaultContent';
import { THEMES } from './themes';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const FALLBACK_SETTINGS = {
  brand: { name: 'Aapla Katta', marathiName: 'आपला कट्टा', prefix: 'वेंगुर्लेकरांचा', tagline: 'Good Mood Food', subtitle: 'Family Restaurant', logoUrl: '', heroImage: '' },
  theme: { preset: 'classic', colors: THEMES.classic.colors, banner: { enabled: false, text: '' }, effect: 'none' },
  contact: { phone: '+91 9763691996', whatsapp: '919763691996', email: '', address: 'Gawade Colony, Bhoir Colony, Chinchwad, Pune 411033', mapUrl: '', hours: 'Open daily · Closes 11 pm', instagram: 'aapla.katta_gmf' },
  charges: { gstPercent: 0, deliveryFee: 0, minOrder: 0, acceptingOrders: true, enableCOD: true },
  content: {},
};

const loadCart = () => { try { return JSON.parse(localStorage.getItem('ak_cart')) || []; } catch { return []; } };

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [meta, setMeta] = useState({ razorpayEnabled: false, razorpayKeyId: '' });
  const [ready, setReady] = useState(false);
  const [themeOverride, setThemeOverride] = useState(null); // live preview while admin edits
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!getToken());
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [menu, setMenu] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // ---- settings ----
  const refreshSettings = useCallback(async () => {
    try {
      const d = await api.get('/settings');
      setSettings(d.settings);
      setMeta(d.meta);
    } catch { /* keep fallback so the site still renders */ }
    setReady(true);
  }, []);
  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  const saveSettings = useCallback(async (patch) => {
    const d = await api.put('/settings', patch);
    setSettings(d.settings);
    return d.settings;
  }, []);

  const saveContent = useCallback(async (patch) => {
    try {
      await saveSettings({ content: patch });
      toast('Saved ✓');
    } catch (e) { toast(e.message, 'err'); }
  }, [saveSettings, toast]);

  // ---- theme -> CSS variables ----
  const activeTheme = themeOverride || settings.theme;
  useEffect(() => {
    const c = activeTheme.colors;
    const r = document.documentElement.style;
    r.setProperty('--primary', c.primary);
    r.setProperty('--primary-dark', c.primaryDark || c.primary);
    r.setProperty('--secondary', c.secondary);
    r.setProperty('--accent', c.accent);
    r.setProperty('--bg', c.bg);
    r.setProperty('--surface', c.surface || '#fff');
    r.setProperty('--text', c.text);
    r.setProperty('--muted', c.muted || '#7a6a60');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.primary);
  }, [activeTheme]);

  // ---- auth ----
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setAuthReady(true));
  }, []);
  const setAuth = useCallback((token, u) => { setToken(token); setUser(u); }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); setEditMode(false); }, []);
  useEffect(() => { if (user?.role !== 'admin') setEditMode(false); }, [user]);

  // ---- menu ----
  const loadMenu = useCallback(async (force = false) => {
    if (menu && !force) return menu;
    const d = await api.get('/menu' + (user?.role === 'admin' ? '?all=1' : ''));
    setMenu(d.categories);
    return d.categories;
  }, [menu, user]);

  // ---- cart ----
  useEffect(() => { localStorage.setItem('ak_cart', JSON.stringify(cart)); }, [cart]);
  const addToCart = useCallback((item, variant) => {
    const v = item.variants?.length ? (item.variants.find((x) => x.label === variant) || item.variants[0]) : null;
    const key = item._id + '|' + (v?.label || '');
    setCart((c) => {
      const found = c.find((l) => l.key === key);
      if (found) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { key, itemId: item._id, name: item.name, variant: v?.label || '', price: v ? v.price : item.price, qty: 1 }];
    });
  }, []);
  const changeQty = useCallback((key, d) => setCart((c) => c.flatMap((l) => (l.key !== key ? [l] : l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }]))), []);
  const clearCart = useCallback(() => setCart([]), []);
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);
  const cartTotal = cart.reduce((a, l) => a + l.qty * l.price, 0);

  const content = settings.content || {};
  const text = useCallback((k) => content[k] ?? CONTENT[k]?.text ?? '', [content]);

  const value = useMemo(() => ({
    settings, meta, ready, activeTheme, setThemeOverride, refreshSettings, saveSettings, saveContent, text,
    user, authReady, setAuth, logout, isAdmin: user?.role === 'admin',
    menu, loadMenu, setMenu,
    cart, addToCart, changeQty, clearCart, cartCount, cartTotal, cartOpen, setCartOpen,
    editMode, setEditMode, toast, toasts,
  }), [settings, meta, ready, activeTheme, refreshSettings, saveSettings, saveContent, text, user, authReady, setAuth, logout,
    menu, loadMenu, cart, addToCart, changeQty, clearCart, cartCount, cartTotal, cartOpen, editMode, toast, toasts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
