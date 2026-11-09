import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../store';

const EMPTY = { code: '', percent: '10', description: '', maxDiscount: '', minOrder: '', usageLimit: '', expiry: '', oncePerUser: false, active: true };
const pad = (n) => String(n).padStart(2, '0');
const toDateInput = (iso) => { if (!iso) return ''; const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const endOfDay = (s) => (s ? new Date(`${s}T23:59:59`).toISOString() : null); // "valid until" is inclusive of that whole day

/** Admin → Coupons: create discount codes customers can enter at checkout. */
export default function AdminCoupons() {
  const { toast } = useApp();
  const [list, setList] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/coupons').then((d) => setList(d.coupons)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const body = (x) => ({ code: x.code, percent: x.percent, description: x.description, maxDiscount: x.maxDiscount, minOrder: x.minOrder, usageLimit: x.usageLimit, expiresAt: endOfDay(x.expiry), oncePerUser: x.oncePerUser, active: x.active });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (editId) await api.put(`/coupons/${editId}`, body(f)); else await api.post('/coupons', body(f));
      toast(editId ? 'Coupon updated ✓' : 'Coupon created ✓'); setF(EMPTY); setEditId(null); load();
    } catch (er) { toast(er.message, 'err'); } finally { setBusy(false); }
  };
  const edit = (c) => {
    setEditId(c._id); window.scrollTo({ top: 0, behavior: 'smooth' });
    setF({ code: c.code, percent: String(c.percent), description: c.description || '', maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', minOrder: c.minOrder ? String(c.minOrder) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', expiry: toDateInput(c.expiresAt), oncePerUser: !!c.oncePerUser, active: c.active });
  };
  const toggle = async (c) => {
    try { await api.put(`/coupons/${c._id}`, body({ ...c, expiry: toDateInput(c.expiresAt), active: !c.active })); load(); } catch (er) { toast(er.message, 'err'); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? Past orders keep their discount.`)) return;
    try { await api.del(`/coupons/${c._id}`); toast('Deleted'); load(); } catch (er) { toast(er.message, 'err'); }
  };
  const state = (c) => {
    if (!c.active) return ['Off', ''];
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return ['Expired', ''];
    if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return ['Used up', ''];
    return ['Live', 'chip-pop'];
  };

  return (
    <div className="coupon-admin">
      <section className="card" style={{ marginBottom: 16 }}>
        <h3>{editId ? '✏️ Edit coupon' : '➕ New coupon'}</h3>
        <p className="muted">Customers type the code on the payment screen. The discount is taken off the food total (GST is then calculated on the reduced amount; the delivery fee is not discounted).</p>
        <form onSubmit={save}>
          <div className="form-grid">
            <label>Coupon code<input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="DIWALI10" maxLength={20} autoCapitalize="characters" /></label>
            <label>Discount %<input required type="number" min="1" max="100" value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} /></label>
            <label>Maximum discount ₹ <small className="muted">(optional)</small><input type="number" min="0" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} placeholder="No limit" /></label>
            <label>Minimum order ₹ <small className="muted">(optional)</small><input type="number" min="0" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} placeholder="None" /></label>
            <label>Valid until <small className="muted">(optional)</small><input type="date" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} /></label>
            <label>Total uses allowed <small className="muted">(optional)</small><input type="number" min="0" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} placeholder="Unlimited" /></label>
          </div>
          <label>Note for yourself <small className="muted">(optional)</small><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. Diwali festival offer" maxLength={120} /></label>
          <div className="coupon-checks">
            <label className="check"><input type="checkbox" checked={f.oncePerUser} onChange={(e) => setF({ ...f, oncePerUser: e.target.checked })} /> Each customer can use it only once</label>
            <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          </div>
          <div className="coupon-actions">
            <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : editId ? 'Save changes' : 'Create coupon'}</button>
            {editId && <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditId(null); setF(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>🎟️ Your coupons</h3>
        {!list && <div className="center"><div className="spinner" /></div>}
        {list && !list.length && <p className="muted">No coupons yet. Create your first one above.</p>}
        {(list || []).map((c) => {
          const [label, cls] = state(c);
          return (
            <div key={c._id} className="admin-item coupon-row">
              <div className="ai-name">
                <b className="coupon-code">{c.code}</b>
                <small className="muted">
                  {c.percent}% off{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}{c.minOrder ? ` · min ₹${c.minOrder}` : ''}{c.expiresAt ? ` · until ${new Date(c.expiresAt).toLocaleDateString('en-IN')}` : ''}{c.oncePerUser ? ' · once per customer' : ''}
                </small>
                <small className="muted">Used {c.usedCount}{c.usageLimit ? ` of ${c.usageLimit}` : ''} times{c.description ? ` · ${c.description}` : ''}</small>
              </div>
              <span className={`chip ${cls}`}>{label}</span>
              <button className="btn btn-sm btn-outline" onClick={() => toggle(c)}>{c.active ? 'Turn off' : 'Turn on'}</button>
              <button className="btn btn-sm btn-outline" onClick={() => edit(c)}>Edit</button>
              <button className="icon-btn" title="Delete" onClick={() => remove(c)}>🗑️</button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
