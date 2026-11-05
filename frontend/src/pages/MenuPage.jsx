import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import Editable from '../components/Editable';
import DishCard from '../components/DishCard';

export default function MenuPage() {
  const { menu, loadMenu } = useApp();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');
  const [err, setErr] = useState('');
  const { hash } = useLocation();

  useEffect(() => { loadMenu().catch((e) => setErr(e.message)); }, [loadMenu]);

  const groups = useMemo(() => ['All', ...Array.from(new Set((menu || []).map((c) => c.group)))], [menu]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (menu || [])
      .filter((c) => group === 'All' || c.group === group)
      .map((c) => ({ ...c, items: term ? c.items.filter((i) => i.name.toLowerCase().includes(term)) : c.items }))
      .filter((c) => c.items.length);
  }, [menu, q, group]);

  useEffect(() => {
    if (hash && menu) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }, [hash, menu]);

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <div className="container">
          <Editable k="menu.title" as="h1" />
          <Editable k="menu.subtitle" as="p" />
        </div>
      </div>

      <div className="container">
        <div className="menu-tools">
          <div className="search"><span>🔍</span><input placeholder="Search dishes… (paneer, dosa, noodles)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="pills">
            {groups.map((g) => <button key={g} className={`pill ${g === group ? 'on' : ''}`} onClick={() => setGroup(g)}>{g}</button>)}
          </div>
          {menu && (
            <div className="pills cat-pills">
              {menu.filter((c) => group === 'All' || c.group === group).map((c) => (
                <a key={c._id} className="pill pill-soft" href={`#${c.slug}`} onClick={(e) => { e.preventDefault(); document.getElementById(c.slug)?.scrollIntoView({ behavior: 'smooth' }); }}>{c.icon} {c.name}</a>
              ))}
            </div>
          )}
        </div>

        {err && <p className="alert err">{err}</p>}
        {!menu && !err && <div className="center" style={{ padding: 60 }}><div className="spinner" /><p className="muted">Loading menu… (the server may take a few seconds to wake up)</p></div>}

        {shown.map((c) => (
          <section key={c._id} id={c.slug} className="menu-cat">
            <motion.div className="menu-cat-head" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="menu-cat-icon">{c.icon}</span>
              <div><h2>{c.name}</h2>{c.description && <p className="muted">{c.description}</p>}</div>
            </motion.div>
            <div className="dish-list">
              {c.items.map((it) => <DishCard key={it._id} item={it} emoji={c.icon} />)}
            </div>
          </section>
        ))}
        {menu && !shown.length && <p className="center muted" style={{ padding: 60 }}>No dishes match “{q}”.</p>}
      </div>
    </div>
  );
}
