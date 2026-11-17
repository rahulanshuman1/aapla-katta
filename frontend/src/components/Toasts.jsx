import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store';

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.type}`} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
