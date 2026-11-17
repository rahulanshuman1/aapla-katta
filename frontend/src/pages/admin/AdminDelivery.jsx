import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../store';

/** Admin → Delivery team: create rider accounts (they sign in at /login and land on their delivery page). */
export default function AdminDelivery() {
  const { toast } = useApp();
  const [list, setList] = useState(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/delivery/partners').then((d) => setList(d.partners)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/delivery/partners', f); toast('Delivery partner added ✓'); setF({ name: '', email: '', phone: '', password: '' }); load(); }
    catch (er) { toast(er.message, 'err'); } finally { setBusy(false); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.name}? They will no longer be able to sign in.`)) return;
    try { await api.del(`/delivery/partners/${p.id}`); toast('Removed'); load(); } catch (er) { toast(er.message, 'err'); }
  };
  const reset = async (p) => {
    const password = window.prompt(`New password for ${p.name} (min 8 characters):`);
    if (!password) return;
    try { await api.put(`/delivery/partners/${p.id}/password`, { password }); toast('Password updated ✓'); } catch (er) { toast(er.message, 'err'); }
  };

  return (
    <div className="delivery-admin">
      <section className="card" style={{ marginBottom: 16 }}>
        <h3>➕ Add delivery partner</h3>
        <p className="muted">Create an account for each rider. They sign in at <b>/login</b> with these details and see their assigned deliveries.</p>
        <form onSubmit={add}>
          <div className="form-grid">
            <label>Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Mobile number (shown to customers)<input required type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label>Email (their login)<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Password (min 8 characters)<input required minLength={8} type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Adding…' : 'Add partner'}</button>
        </form>
      </section>

      <section className="card">
        <h3>🛵 Delivery team</h3>
        {!list && <div className="center"><div className="spinner" /></div>}
        {list && !list.length && <p className="muted">No delivery partners yet. Add one above, then assign them to delivery orders from the Orders tab.</p>}
        {(list || []).map((p) => (
          <div key={p.id} className="admin-item">
            <div className="ai-name"><b>{p.name}</b><small className="muted"> {p.phone} · {p.email}</small></div>
            <span className={`chip ${p.activeOrders ? 'chip-pop' : ''}`}>{p.activeOrders} active</span>
            <button className="btn btn-sm btn-outline" onClick={() => reset(p)}>Reset password</button>
            <button className="icon-btn" title="Remove" onClick={() => remove(p)}>🗑️</button>
          </div>
        ))}
      </section>
    </div>
  );
}
