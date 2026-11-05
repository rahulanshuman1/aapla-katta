import { useEffect, useMemo, useState } from 'react';
import { api, fileToDataUrl, inr } from '../../api';
import { useApp } from '../../store';

const blank = (category) => ({ category, name: '', description: '', price: '', variants: [], isVeg: true, tags: [], image: '', available: true, popular: false });
const TAGS = [['spicy', '🌶️ Spicy'], ['sweet', '🍯 Sweet'], ['chef', "👨‍🍳 Chef's pick"]];

function ItemForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ ...initial, variants: initial.variants || [], tags: initial.tags || [] });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggleTag = (t) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t]);
  const setVariant = (i, k, v) => set('variants', f.variants.map((x, n) => (n === i ? { ...x, [k]: v } : x)));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await onSave(f); } finally { setBusy(false); }
  };

  return (
    <form className="card item-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Dish name<input required value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>Price (₹){f.variants.length > 0 ? ' – set by sizes' : ''}<input type="number" min="0" required={!f.variants.length} disabled={f.variants.length > 0} value={f.variants.length ? Math.min(...f.variants.map((v) => Number(v.price) || 0)) : f.price} onChange={(e) => set('price', e.target.value)} /></label>
      </div>
      <label>Description (optional)<input value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description shown under the name" /></label>

      <div className="variants">
        <b>Sizes (optional, e.g. Half / Full)</b>
        {f.variants.map((v, i) => (
          <div key={i} className="variant-row">
            <input placeholder="Label" value={v.label} onChange={(e) => setVariant(i, 'label', e.target.value)} />
            <input type="number" min="0" placeholder="Price" value={v.price} onChange={(e) => setVariant(i, 'price', e.target.value)} />
            <button type="button" className="icon-btn" onClick={() => set('variants', f.variants.filter((_, n) => n !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="link-btn" onClick={() => set('variants', [...f.variants, { label: '', price: '' }])}>+ Add size</button>
      </div>

      <div className="check-row">
        <label className="check"><input type="checkbox" checked={f.available} onChange={(e) => set('available', e.target.checked)} /> Available</label>
        <label className="check"><input type="checkbox" checked={f.popular} onChange={(e) => set('popular', e.target.checked)} /> Show in “Crowd Favourites”</label>
        <label className="check"><input type="checkbox" checked={f.isVeg} onChange={(e) => set('isVeg', e.target.checked)} /> Vegetarian</label>
        {TAGS.map(([t, l]) => <label key={t} className="check"><input type="checkbox" checked={f.tags.includes(t)} onChange={() => toggleTag(t)} /> {l}</label>)}
      </div>

      <div className="img-row">
        {f.image && <img src={f.image} alt="" className="thumb" />}
        <label className="btn btn-sm btn-outline">{f.image ? 'Change photo' : 'Upload photo'}
          <input hidden type="file" accept="image/*" onChange={async (e) => e.target.files[0] && set('image', await fileToDataUrl(e.target.files[0], 700))} />
        </label>
        {f.image && <button type="button" className="link-btn" onClick={() => set('image', '')}>Remove photo</button>}
      </div>

      <div className="btn-row">
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save dish'}</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function AdminMenu() {
  const { toast, setMenu } = useApp();
  const [cats, setCats] = useState(null);
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null); // item object or 'new'
  const [q, setQ] = useState('');
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    const d = await api.get('/menu?all=1');
    setCats(d.categories); setMenu(d.categories);
    setActive((a) => a || d.categories[0]?._id);
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'err')); return () => setMenu(null); }, []); // eslint-disable-line

  const cat = useMemo(() => (cats || []).find((c) => c._id === active), [cats, active]);
  const items = (cat?.items || []).filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  const run = async (fn, ok) => { try { await fn(); await load(); ok && toast(ok); } catch (e) { toast(e.message, 'err'); } };

  const saveItem = (f) => run(async () => {
    f.variants = (f.variants || []).filter((v) => v.label && v.price !== '');
    if (f._id) await api.put(`/menu/items/${f._id}`, f); else await api.post('/menu/items', { ...f, category: active });
    setEditing(null);
  }, 'Dish saved ✓');

  // Quick inline price edit
  const quickPrice = (it, v) => run(() => api.put(`/menu/items/${it._id}`, { price: Number(v) || 0 }), 'Price updated ✓');

  if (!cats) return <div className="center"><div className="spinner" /></div>;

  return (
    <div className="menu-admin">
      <aside className="cat-side">
        {cats.map((c) => (
          <button key={c._id} className={c._id === active ? 'on' : ''} onClick={() => { setActive(c._id); setEditing(null); }}>
            <span>{c.icon} {c.name}</span><small>{c.items.length}</small>
          </button>
        ))}
        <form className="add-cat" onSubmit={(e) => { e.preventDefault(); if (newCat.trim()) run(() => api.post('/menu/categories', { name: newCat.trim(), group: cat?.group || 'Menu' }), 'Category added').then(() => setNewCat('')); }}>
          <input placeholder="New category…" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="btn btn-sm btn-primary">Add</button>
        </form>
      </aside>

      <section>
        {cat && (
          <>
            <div className="cat-edit card">
              <input value={cat.icon} style={{ width: 60, textAlign: 'center' }} onChange={(e) => setCats(cats.map((c) => (c._id === cat._id ? { ...c, icon: e.target.value } : c)))} onBlur={() => run(() => api.put(`/menu/categories/${cat._id}`, { icon: cat.icon }))} />
              <input value={cat.name} onChange={(e) => setCats(cats.map((c) => (c._id === cat._id ? { ...c, name: e.target.value } : c)))} onBlur={() => run(() => api.put(`/menu/categories/${cat._id}`, { name: cat.name }), 'Category renamed')} />
              <label className="check"><input type="checkbox" checked={cat.active} onChange={(e) => run(() => api.put(`/menu/categories/${cat._id}`, { active: e.target.checked }), e.target.checked ? 'Category visible' : 'Category hidden')} /> Visible</label>
              <button className="btn btn-sm btn-outline" onClick={() => window.confirm(`Delete "${cat.name}" and all its dishes?`) && run(async () => { await api.del(`/menu/categories/${cat._id}`); setActive(null); }, 'Category deleted')}>Delete</button>
            </div>

            <div className="menu-admin-tools">
              <input className="search-input" placeholder="Search in this category…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(blank(cat._id))}>+ Add dish</button>
            </div>

            {editing && !editing._id && <ItemForm initial={editing} onSave={saveItem} onCancel={() => setEditing(null)} />}

            <div className="admin-items">
              {items.map((it) => (
                editing?._id === it._id ? (
                  <ItemForm key={it._id} initial={editing} onSave={saveItem} onCancel={() => setEditing(null)} />
                ) : (
                  <div key={it._id} className={`admin-item ${!it.available ? 'off' : ''}`}>
                    <div className="ai-name">{it.image && <img src={it.image} alt="" />}<b>{it.name}</b>
                      {it.variants?.length > 0 && <small className="muted"> {it.variants.map((v) => `${v.label} ${inr(v.price)}`).join(' / ')}</small>}
                    </div>
                    {it.variants?.length ? <span className="muted">—</span> : (
                      <span className="ai-price">₹<input type="number" defaultValue={it.price} onBlur={(e) => Number(e.target.value) !== it.price && quickPrice(it, e.target.value)} /></span>
                    )}
                    <label className="switch" title="Available"><input type="checkbox" checked={it.available} onChange={(e) => run(() => api.put(`/menu/items/${it._id}`, { available: e.target.checked }))} /><i /></label>
                    <button className="icon-btn" title="Edit" onClick={() => setEditing(it)}>✏️</button>
                    <button className="icon-btn" title="Delete" onClick={() => window.confirm(`Delete ${it.name}?`) && run(() => api.del(`/menu/items/${it._id}`), 'Dish deleted')}>🗑️</button>
                  </div>
                )
              ))}
              {!items.length && <p className="muted center" style={{ padding: 24 }}>No dishes found.</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
