import { useEffect, useState } from 'react';
import { fileToDataUrl } from '../../api';
import { useApp } from '../../store';
import { THEMES, EFFECTS } from '../../themes';
import AnimatedLogo from '../../components/AnimatedLogo';

const COLOR_FIELDS = [
  ['primary', 'Primary (buttons, logo)'], ['primaryDark', 'Primary – dark'], ['secondary', 'Secondary (gold accents)'],
  ['accent', 'Accent'], ['bg', 'Page background'], ['surface', 'Cards'], ['text', 'Text'], ['muted', 'Muted text'],
];

export default function AdminAppearance() {
  const { settings, saveSettings, setThemeOverride, toast } = useApp();
  const [theme, setTheme] = useState(settings.theme);
  const [brand, setBrand] = useState(settings.brand);
  const [busy, setBusy] = useState(false);

  // Live preview of unsaved theme changes; revert if the admin leaves without saving
  useEffect(() => { setThemeOverride(theme); }, [theme, setThemeOverride]);
  useEffect(() => () => setThemeOverride(null), [setThemeOverride]);

  const applyPreset = (key) => {
    const p = THEMES[key];
    setTheme({ preset: key, colors: { ...p.colors }, effect: p.effect, banner: { enabled: key !== 'classic', text: p.banner } });
  };
  const setColor = (k, v) => setTheme((t) => ({ ...t, preset: 'custom', colors: { ...t.colors, [k]: v } }));

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({ theme, brand: { logoUrl: brand.logoUrl, heroImage: brand.heroImage, name: brand.name, marathiName: brand.marathiName, prefix: brand.prefix, tagline: brand.tagline, subtitle: brand.subtitle } });
      toast('Appearance saved ✓');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const upload = (key, max) => async (e) => {
    const file = e.target.files[0];
    if (file) setBrand({ ...brand, [key]: await fileToDataUrl(file, max, 0.9) });
  };

  return (
    <div className="appearance">
      <section className="card">
        <h3>🎉 Festival themes</h3>
        <p className="muted">Pick a theme to preview it instantly across the whole site, then press Save. Switch back to “Classic Katta” after the festival.</p>
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
        <h3>🖼️ Logo & branding</h3>
        <div className="logo-preview"><AnimatedLogo key={brand.logoUrl + brand.marathiName} variant="hero" /></div>
        <div className="img-row">
          <label className="btn btn-sm btn-outline">Upload logo (PNG recommended)
            <input hidden type="file" accept="image/*" onChange={upload('logoUrl', 600)} />
          </label>
          {brand.logoUrl && <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, logoUrl: '' })}>Use built-in animated logo</button>}
        </div>
        <div className="img-row">
          {brand.heroImage && <img src={brand.heroImage} alt="" className="thumb" />}
          <label className="btn btn-sm btn-outline">{brand.heroImage ? 'Change' : 'Upload'} home-page hero photo
            <input hidden type="file" accept="image/*" onChange={upload('heroImage', 1100)} />
          </label>
          {brand.heroImage && <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, heroImage: '' })}>Remove</button>}
        </div>
        <p className="muted small">Built-in logo text (used when no logo is uploaded):</p>
        <div className="form-grid">
          <label>Restaurant name<input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></label>
          <label>Marathi name<input value={brand.marathiName} onChange={(e) => setBrand({ ...brand, marathiName: e.target.value })} /></label>
          <label>Line above logo<input value={brand.prefix} onChange={(e) => setBrand({ ...brand, prefix: e.target.value })} /></label>
          <label>Tagline<input value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} /></label>
        </div>
      </section>

      <div className="sticky-save">
        <button className="btn btn-primary btn-lg" disabled={busy} onClick={save}>{busy ? 'Saving…' : '💾 Save appearance'}</button>
      </div>
    </div>
  );
}
