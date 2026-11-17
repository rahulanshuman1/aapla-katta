import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileToDataUrl } from '../../api';
import { useApp } from '../../store';
import { THEMES, EFFECTS } from '../../themes';
import AnimatedLogo from '../../components/AnimatedLogo';

const COLOR_FIELDS = [
  ['primary', 'Primary (buttons, logo)'], ['primaryDark', 'Primary – dark'], ['secondary', 'Secondary (gold accents)'],
  ['accent', 'Accent'], ['bg', 'Page background'], ['surface', 'Cards'], ['text', 'Text'], ['muted', 'Muted text'],
];
const BRAND_KEYS = ['logoUrl', 'heroImage', 'footerImage', 'name', 'marathiName', 'prefix', 'tagline', 'subtitle'];
// JSON with sorted keys, so "same values, different key order" does not count as a change
const stable = (o) => JSON.stringify(o, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
const pickBrand = (b) => Object.fromEntries(BRAND_KEYS.map((k) => [k, b[k] ?? '']));

export default function AdminAppearance() {
  const { savedSettings, draft, setDraft, saveSettings, previewRef, startPreview, toast } = useApp();
  const nav = useNavigate();

  // Start from the unsaved draft (e.g. coming back from a site preview) or from what is saved
  const [theme, setTheme] = useState(() => draft?.theme || savedSettings.theme);
  const [brand, setBrand] = useState(() => pickBrand({ ...savedSettings.brand, ...(draft?.brand || {}) }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');

  // Every change is applied live to the site chrome (colours, banner, logo…) as an unsaved draft
  useEffect(() => { setDraft({ theme, brand }); }, [theme, brand, setDraft]);
  // Leaving this tab throws the draft away – unless the admin is heading to the site preview
  useEffect(() => () => { if (!previewRef.current) setDraft(null); }, [previewRef, setDraft]);

  const dirty = useMemo(
    () => stable({ theme, brand }) !== stable({ theme: savedSettings.theme, brand: pickBrand(savedSettings.brand) }),
    [theme, brand, savedSettings]
  );
  // Warn before closing the tab with unsaved changes
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const warn = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const applyPreset = (key) => {
    const p = THEMES[key];
    setTheme({ preset: key, colors: { ...p.colors }, effect: p.effect, banner: { enabled: key !== 'classic', text: p.banner } });
  };
  const setColor = (k, v) => setTheme((t) => ({ ...t, preset: 'custom', colors: { ...t.colors, [k]: v } }));

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({ theme, brand });
      setDraft(null);
      toast('Appearance saved ✓');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const discard = () => {
    setTheme(savedSettings.theme);
    setBrand(pickBrand(savedSettings.brand));
    toast('Changes discarded');
  };

  const preview = () => { startPreview(); nav('/'); };

  const upload = (key, max, opts) => async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(key);
    try { setBrand((b) => ({ ...b, [key]: '' })); const url = await fileToDataUrl(file, max, 0.85, opts); setBrand((b) => ({ ...b, [key]: url })); }
    catch { toast('Could not read that image. Try a JPG or PNG.', 'err'); setBrand((b) => ({ ...b, [key]: savedSettings.brand[key] || '' })); }
    finally { setUploading(''); }
  };

  return (
    <div className="appearance">
      <section className="card">
        <h3>🎉 Festival themes</h3>
        <p className="muted">Pick a theme to see it instantly. Use <b>Preview on site</b> to look at the real website before saving, then press <b>Save appearance</b>. Switch back to “Classic Katta” after the festival.</p>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([k, t]) => (
            <button key={k} type="button" className={`theme-card ${theme.preset === k ? 'on' : ''}`} onClick={() => applyPreset(k)}>
              <span className="theme-emoji">{t.emoji}</span>
              <b>{t.label}</b>
              <span className="swatches">{[t.colors.primary, t.colors.secondary, t.colors.accent, t.colors.bg].map((c) => <i key={c} style={{ background: c }} />)}</span>
            </button>
          ))}
        </div>

        <h4>Festival banner & effects</h4>
        <div className="form-grid">
          <label className="check"><input type="checkbox" checked={!!theme.banner?.enabled} onChange={(e) => setTheme({ ...theme, banner: { ...theme.banner, enabled: e.target.checked } })} /> Show festival banner at top</label>
          <label>Falling effect
            <select value={theme.effect} onChange={(e) => setTheme({ ...theme, effect: e.target.value })}>
              {Object.keys(EFFECTS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        </div>
        <label>Banner message<input value={theme.banner?.text || ''} onChange={(e) => setTheme({ ...theme, banner: { ...theme.banner, text: e.target.value } })} placeholder="🪔 Happy Diwali from Aapla Katta!" /></label>
      </section>

      <section className="card">
        <h3>🎨 Custom colours</h3>
        <div className="color-grid">
          {COLOR_FIELDS.map(([k, l]) => (
            <label key={k} className="color-field">
              <input type="color" value={theme.colors[k] || '#000000'} onChange={(e) => setColor(k, e.target.value)} />
              <span>{l}<small>{theme.colors[k]}</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>🖼️ Logo, hero & footer images</h3>
        <div className="logo-preview"><AnimatedLogo key={brand.logoUrl + brand.marathiName} variant="hero" /></div>

        <div className="img-row">
          <label className="btn btn-sm btn-outline">{uploading === 'logoUrl' ? 'Uploading…' : 'Upload logo (PNG recommended)'}
            <input hidden type="file" accept="image/*" onChange={upload('logoUrl', 600)} />
          </label>
          {brand.logoUrl && <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, logoUrl: '' })}>Use built-in animated logo</button>}
        </div>

        <div className="img-row">
          {brand.heroImage && <img src={brand.heroImage} alt="" className="thumb" />}
          <label className="btn btn-sm btn-outline">{uploading === 'heroImage' ? 'Uploading…' : `${brand.heroImage ? 'Change' : 'Upload'} home-page hero photo`}
            <input hidden type="file" accept="image/*" onChange={upload('heroImage', 1100, { jpeg: true })} />
          </label>
          {brand.heroImage && <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, heroImage: '' })}>Remove</button>}
        </div>

        <div className="img-row">
          {brand.footerImage && <img src={brand.footerImage} alt="" className="footer-thumb" />}
          <label className="btn btn-sm btn-outline">{uploading === 'footerImage' ? 'Uploading…' : `${brand.footerImage ? 'Change' : 'Upload'} footer background image`}
            <input hidden type="file" accept="image/*" onChange={upload('footerImage', 1600, { jpeg: true })} />
          </label>
          {brand.footerImage && <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, footerImage: '' })}>Remove</button>}
        </div>
        <p className="muted small">Photos are resized and compressed automatically. The footer image is shown behind the footer with a dark overlay so the text stays readable.</p>

        <p className="muted small">Built-in logo text (used when no logo is uploaded):</p>
        <div className="form-grid">
          <label>Restaurant name<input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></label>
          <label>Marathi name<input value={brand.marathiName} onChange={(e) => setBrand({ ...brand, marathiName: e.target.value })} /></label>
          <label>Line above logo<input value={brand.prefix} onChange={(e) => setBrand({ ...brand, prefix: e.target.value })} /></label>
          <label>Tagline<input value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} /></label>
        </div>
      </section>

      <div className="sticky-save">
        {dirty && <span className="dirty-note">● Unsaved changes</span>}
        <button className="btn btn-outline btn-lg" disabled={busy || !!uploading} onClick={preview}>👁️ Preview on site</button>
        {dirty && <button className="btn btn-outline btn-lg" disabled={busy} onClick={discard}>Discard</button>}
        <button className="btn btn-primary btn-lg" disabled={busy || !!uploading || !dirty} onClick={save}>{busy ? 'Saving…' : '💾 Save appearance'}</button>
      </div>
    </div>
  );
}
