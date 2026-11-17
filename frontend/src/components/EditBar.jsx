import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store';

// Floating admin toolbar: shown to admins on public pages.
export default function EditBar() {
  const { isAdmin, editMode, setEditMode, previewing, draft } = useApp();
  if (!isAdmin || (previewing && draft)) return null;
  return (
    <AnimatePresence>
      <motion.div className="editbar" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <button className={`btn btn-sm ${editMode ? 'btn-gold' : 'btn-light'}`} onClick={() => setEditMode(!editMode)}>
          {editMode ? '✅ Editing text – click any text' : '✏️ Edit page text'}
        </button>
        <Link className="btn btn-sm btn-dark" to="/admin">⚙️ Admin panel</Link>
      </motion.div>
    </AnimatePresence>
  );
}
