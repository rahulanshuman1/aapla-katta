import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedLogo from './AnimatedLogo';
import { useApp } from '../store';

// Brand intro shown once per browser session.
export default function Splash() {
  const { ready } = useApp();
  const [show, setShow] = useState(() => !sessionStorage.getItem('ak_splash'));
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setMinDone(true), 2300);
    return () => clearTimeout(t);
  }, [show]);

  useEffect(() => {
    if (show && minDone && ready) {
      sessionStorage.setItem('ak_splash', '1');
      setShow(false);
    }
  }, [show, minDone, ready]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="splash" exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.6 }}>
          <div className="splash-glow" />
          <AnimatedLogo variant="hero" />
          <motion.p className="splash-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            Family Restaurant · Chinchwad, Pune
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
