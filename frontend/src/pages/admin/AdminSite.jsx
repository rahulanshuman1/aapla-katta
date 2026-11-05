import { useMemo, useState } from 'react';
import { useApp } from '../../store';
import { CONTENT } from '../../defaultContent';

/** Edit every website text from one screen. */
export function AdminContent() {
  const { settings, saveSettings, toast } = useApp();
  const [vals, setVals] = useState(() => Object.fromEntries(Object.entries(CONTENT).map(([k, v]) => [k, settings.content?.[k] ?? v.text])));
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const g = {};
    Object.entries(CONTENT).forEach(([k, v]) => (g[v.group] ||= []).push([k, v]));
    return g;
  }, []);

  const save = async () => {
    setBusy(true);
    try { await saveSettings({ content: vals }); toast('Website text saved ✓'); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const reset = (k) => setVals({ ...vals, [k]: CONTENT[k].text });

  return (
    <div>
      {Object.entries(groups).map(([name, fields]) => (
        <section key={name} className="card" style={{ marginBottom: 16 }}>
          <h3>{name}</h3>
          {fields.map(([k, v]) => (
            <label key={k}>
              <span className="lbl">{v.label} {vals[k] !== v.text && <button type="button" className="link-btn" onClick={() => reset(k)}>reset</button>}</span>
              {v.multiline
                ? <textarea rows={3} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
                : <input value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />}
            </label>
          ))}
        </section>
      ))}
      <div className="sticky-save"><button className="btn btn-primary btn-lg" disabled={busy} onClick={save}>{busy ? 'Saving…' : '💾 Save all text'}</button></div>
    </div>
  );
}

/** Contact details + order settings (GST, delivery fee, COD, pause ordering). */
export function AdminBusiness() {
  const { settings, saveSettings, toast } = useApp();
  const [contact, setContact] = useState(settings.contact);
  const [charges, setCharges] = useState(settings.charges);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({
        contact,
        charges: { ...charges, gstPercent: Number(charges.gstPercent) || 0, deliveryFee: Number(charges.deliveryFee) || 0, minOrder: Number(charges.minOrder) || 0 },
      });
      toast('Settings saved ✓');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const c = (k) => ({ value: contact[k] || '', onChange: (e) => setContact({ ...contact, [k]: e.target.value }) });

  return (
    <div>
      <section className="card" style={{ marginBottom: 16 }}>
        <h3>📞 Contact details</h3>
        <div className="form-grid">
          <label>Phone<input {...c('phone')} /></label>
          <label>WhatsApp number (with country code, digits only)<input {...c('whatsapp')} placeholder="919763691996" /></label>
          <label>Public email<input type="email" {...c('email')} /></label>
          <label>Instagram handle (without @)<input {...c('instagram')} /></label>
        </div>
        <label>Address<textarea rows={2} {...c('address')} /></label>
        <label>Opening hours text<input {...c('hours')} /></label>
        <label>Google Maps link<input {...c('mapUrl')} placeholder="https://maps.google.com/?q=..." /></label>
      </section>

      <section className="card">
        <h3>🧾 Ordering & charges</h3>
        <div className="form-grid">
          <label>GST % added to orders<input type="number" min="0" step="0.5" value={charges.gstPercent} onChange={(e) => setCharges({ ...charges, gstPercent: e.target.value })} /></label>
          <label>Delivery fee (₹)<input type="number" min="0" value={charges.deliveryFee} onChange={(e) => setCharges({ ...charges, deliveryFee: e.target.value })} /></label>
          <label>Minimum order (₹)<input type="number" min="0" value={charges.minOrder} onChange={(e) => setCharges({ ...charges, minOrder: e.target.value })} /></label>
        </div>
        <div className="check-row">
          <label className="check"><input type="checkbox" checked={charges.acceptingOrders} onChange={(e) => setCharges({ ...charges, acceptingOrders: e.target.checked })} /> Accepting online orders</label>
          <label className="check"><input type="checkbox" checked={charges.enableCOD} onChange={(e) => setCharges({ ...charges, enableCOD: e.target.checked })} /> Allow “pay at restaurant / on delivery”</label>
        </div>
      </section>
      <div className="sticky-save"><button className="btn btn-primary btn-lg" disabled={busy} onClick={save}>{busy ? 'Saving…' : '💾 Save settings'}</button></div>
    </div>
  );
}
