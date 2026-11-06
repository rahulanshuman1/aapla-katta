import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store';

/**
 * Shown while the admin is previewing UNSAVED appearance changes on the real site.
 * The preview exists only in this browser until "Save & publish" is pressed.
 */
export default function PreviewBar() {
  const { draft, setDraft, previewing, endPreview, saveSettings, toast } = useApp();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const show = previewing && !!draft;

  const publish = async () => {
    setBusy(true);
    try {
      await saveSettings({ theme: draft.theme, brand: draft.brand });
      setDraft(null); endPreview();
      toast('Appearance saved & published ✓');
      nav('/admin');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const back = () => { endPreview(); nav('/admin'); };           // keeps the draft so editing continues
  const discard = () => { setDraft(null); endPreview(); toast('Preview discarded'); nav('/admin'); };

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="previewbar" initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }}>
          <div className="previewbar-msg"><b>👁️ Preview mode</b><span>These changes are not saved yet. Only you can see them.</span></div>
          <div className="btn-row">
            <button className="btn btn-sm btn-light" onClick={back} disabled={busy}>✏️ Keep editing</button>
            <button className="btn btn-sm btn-outline-light" onClick={discard} disabled={busy}>✕ Discard</button>
            <button className="btn btn-sm btn-gold" onClick={publish} disabled={busy}>{busy ? 'Saving…' : '💾 Save & publish'}</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
