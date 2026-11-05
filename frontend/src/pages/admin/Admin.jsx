import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../store';
import AdminOrders from './AdminOrders';
import AdminMenu from './AdminMenu';
import AdminAppearance from './AdminAppearance';
import { AdminContent, AdminBusiness } from './AdminSite';

const TABS = [
  ['orders', '📦 Orders'],
  ['menu', '🍽️ Menu & prices'],
  ['appearance', '🎨 Theme & logo'],
  ['content', '✏️ Website text'],
  ['business', '🏪 Contact & settings'],
];

export default function Admin() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('ak_admin_tab') || 'orders');
  const { setEditMode } = useApp();
  useEffect(() => { sessionStorage.setItem('ak_admin_tab', tab); }, [tab]);
  useEffect(() => () => setEditMode(false), [setEditMode]);

  return (
    <div className="admin container">
      <div className="admin-head">
        <h1>Admin panel</h1>
        <p className="muted">Everything on the website can be changed from here. Tip: on any public page use <b>“Edit page text”</b> (bottom right) to edit text in place.</p>
      </div>
      <div className="admin-tabs">
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
            {tab === k && <motion.i layoutId="tab-underline" className="tab-underline" />}
          </button>
        ))}
      </div>
      <div className="admin-body">
        {tab === 'orders' && <AdminOrders />}
        {tab === 'menu' && <AdminMenu />}
        {tab === 'appearance' && <AdminAppearance />}
        {tab === 'content' && <AdminContent />}
        {tab === 'business' && <AdminBusiness />}
      </div>
    </div>
  );
}
