import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useApp } from '../store';
import AnimatedLogo from '../components/AnimatedLogo';

function Shell({ title, sub, children }) {
  return (
    <div className="auth-page">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo"><AnimatedLogo variant="compact" animateIn={false} /></div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
        {children}
      </motion.div>
    </div>
  );
}

export function Login() {
  const { setAuth, toast } = useApp();
  const [p] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [unverified, setUnverified] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setUnverified(false);
    try {
      const d = await api.post('/auth/login', f);
      setAuth(d.token, d.user);
      toast(`Welcome back, ${d.user.name.split(' ')[0]}!`);
      nav(p.get('next') || (d.user.role === 'admin' ? '/admin' : d.user.role === 'delivery' ? '/delivery' : '/menu'), { replace: true });
    } catch (e2) {
      setErr(e2.message);
      if (e2.code === 'EMAIL_NOT_VERIFIED') setUnverified(true);
    } finally { setBusy(false); }
  };
  const resend = async () => { await api.post('/auth/resend-verification', { email: f.email }); toast('Verification email sent again 📧'); };

  return (
    <Shell title="Sign in" sub="Welcome back! Sign in to order and track your food.">
      <form onSubmit={submit}>
        <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="alert err">{err}</p>}
        {unverified && <button type="button" className="link-btn" onClick={resend}>Resend verification email</button>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-links"><Link to="/forgot-password">Forgot password?</Link><span>New here? <Link to={`/register${p.get('next') ? `?next=${p.get('next')}` : ''}`}>Create an account</Link></span></p>
    </Shell>
  );
}

export function Register() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const { toast } = useApp();

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api.post('/auth/register', f); setDone(true); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <Shell title="Check your inbox 📧">
        <p>We've sent a verification link to <b>{f.email}</b>. Click it to activate your account.</p>
        <p className="muted">Can't see it? Check your spam folder.</p>
        <button className="btn btn-outline btn-block" onClick={async () => { await api.post('/auth/resend-verification', { email: f.email }); toast('Sent again 📧'); }}>Resend email</button>
        <p className="auth-links"><Link to="/login">Back to sign in</Link></p>
      </Shell>
    );
  }
  return (
    <Shell title="Create account" sub="Join Aapla Katta for faster ordering and live order tracking.">
      <form onSubmit={submit}>
        <label>Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Mobile number<input type="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label>Password<input type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="alert err">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="auth-links"><span>Already registered? <Link to="/login">Sign in</Link></span></p>
    </Shell>
  );
}

export function VerifyEmail() {
  const [p] = useSearchParams();
  const { setAuth } = useApp();
  const nav = useNavigate();
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke guard (token is single use)
    ran.current = true;
    api.post('/auth/verify-email', { token: p.get('token') })
      .then((d) => { setAuth(d.token, d.user); setState('ok'); setTimeout(() => nav('/menu'), 2500); })
      .catch((e) => { setMsg(e.message); setState('err'); });
  }, []); // eslint-disable-line

  return (
    <Shell title={state === 'ok' ? 'Email verified 🎉' : state === 'err' ? 'Verification failed' : 'Verifying…'}>
      {state === 'loading' && <div className="center"><div className="spinner" /></div>}
      {state === 'ok' && <p>You're all set and signed in. A welcome email is on its way. Taking you to the menu…</p>}
      {state === 'err' && <><p className="alert err">{msg}</p><Link className="btn btn-primary btn-block" to="/login">Go to sign in</Link></>}
    </Shell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e) => { e.preventDefault(); await api.post('/auth/forgot-password', { email }); setSent(true); };
  return (
    <Shell title="Forgot password" sub="We'll email you a link to reset it.">
      {sent ? <p className="alert ok">If an account exists for {email}, a reset link has been sent.</p> : (
        <form onSubmit={submit}>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn btn-primary btn-block">Send reset link</button>
        </form>
      )}
      <p className="auth-links"><Link to="/login">Back to sign in</Link></p>
    </Shell>
  );
}

export function Reset() {
  const [p] = useSearchParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/auth/reset-password', { token: p.get('token'), password }); toast('Password updated. Please sign in.'); nav('/login'); }
    catch (e2) { setErr(e2.message); }
  };
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit}>
        <label>New password<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="alert err">{err}</p>}
        <button className="btn btn-primary btn-block">Update password</button>
      </form>
    </Shell>
  );
}
