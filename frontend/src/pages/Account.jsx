import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { useApp } from '../store';
import PasswordInput from '../components/PasswordInput';

/** My account: edit details and delete the account (required by Apple App Store and Google Play). */
export default function Account() {
  const { user, setAuth, logout, toast } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState('');
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const d = await api.put('/auth/me', f); setAuth(getToken(), d.user); toast('Details saved ✓'); }
    catch (e2) { toast(e2.message, 'err'); } finally { setSaving(false); }
  };

  const del = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api.del('/auth/me', { password: pw });
      logout(); toast('Your account has been deleted.'); nav('/', { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="container narrow page-pad">
      <h1 className="page-title">My account</h1>

      <form className="card" onSubmit={save} style={{ marginBottom: 20 }}>
        <h3>Your details</h3>
        <label>Email<input value={user.email} disabled /></label>
        <label>Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Mobile number<input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label>Default delivery address<textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
      </form>

      {user.role === 'customer' && (
        <form className="card danger-zone" onSubmit={del}>
          <h3>Delete my account</h3>
          <p className="muted">This permanently deletes your account and removes your name, phone number, address and saved locations from all your past orders. It cannot be undone.</p>
          <label>Enter your password to confirm<PasswordInput required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> I understand this cannot be undone</label>
          {err && <p className="alert err">{err}</p>}
          <button className="btn btn-outline" disabled={busy || !sure || !pw}>{busy ? 'Deleting…' : 'Delete my account'}</button>
        </form>
      )}
      {user.role !== 'customer' && <p className="muted small">Staff accounts (owner and delivery partners) are managed by the restaurant. Please contact the owner to remove one.</p>}
    </div>
  );
}
