import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedLogo from './AnimatedLogo';
import { useApp } from '../store';

// Brand intro shown once per browser session.
export default function Splash() {
  const { ready } = useApp();
  const [show, setShow] = useState(() => !sessionStorage.getItem('ak_splash'));
  const [minDone, setMinDone] = useState(false);
  const [maxDone, setMaxDone] = useState(false);

  useEffect(() => {
    if (!show) return;
    // short brand moment (1.8 s); never wait more than 3 s for the server – it may be waking up (Render free plan)
    const t = setTimeout(() => setMinDone(true), 1800);
    const t2 = setTimeout(() => setMaxDone(true), 3000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [show]);

  useEffect(() => {
    if (show && minDone && (ready || maxDone)) {
      sessionStorage.setItem('ak_splash', '1');
      setShow(false);
    }
  }, [show, minDone, maxDone, ready]);

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
