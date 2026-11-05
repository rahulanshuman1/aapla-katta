import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useApp } from '../store';

// Splits Devanagari text into grapheme clusters so matras / conjuncts stay together while animating.
function graphemes(str) {
  try {
    const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
    return Array.from(seg.segment(str), (s) => s.segment);
  } catch {
    return Array.from(str);
  }
}

const steam = [
  { d: 'M20 56 C 8 44, 32 36, 20 22 C 12 12, 26 6, 22 0', delay: 0 },
  { d: 'M50 56 C 38 42, 62 34, 50 20 C 42 10, 56 4, 52 -2', delay: 0.5 },
  { d: 'M80 56 C 68 44, 92 36, 80 22 C 72 12, 86 6, 82 0', delay: 1 },
];

/**
 * variant "hero"    – big, with steam + tagline pill (splash, home)
 * variant "compact" – ribbon only (navbar)
 * If the admin uploaded a logo it is shown with the same entrance + floating animation.
 */
export default function AnimatedLogo({ variant = 'hero', animateIn = true }) {
  const { settings } = useApp();
  const { brand } = settings;
  const letters = useMemo(() => graphemes(brand.marathiName), [brand.marathiName]);
  const compact = variant === 'compact';

  if (brand.logoUrl) {
    return (
      <motion.div
        className={`logo-img-wrap ${compact ? 'compact' : ''}`}
        initial={animateIn ? { opacity: 0, scale: 0.7, rotate: -6 } : false}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <motion.img
          src={brand.logoUrl}
          alt={brand.name}
          animate={compact ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="logo-shine" />
      </motion.div>
    );
  }

  return (
    <div className={`logo ${compact ? 'logo-compact' : ''}`} aria-label={brand.name}>
      {!compact && (
        <svg className="logo-steam" viewBox="0 0 100 60" fill="none" aria-hidden="true">
          {steam.map((s, i) => (
            <motion.path
              key={i}
              d={s.d}
              stroke="var(--secondary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0], y: [6, 0, -8] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      )}
      {!compact && brand.prefix && (
        <motion.div className="logo-prefix" initial={animateIn ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {brand.prefix}
        </motion.div>
      )}
      <motion.div
        className="logo-ribbon"
        initial={animateIn ? { scale: 0.5, opacity: 0, rotate: -5 } : false}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 130, damping: 11 }}
      >
        <span className="logo-name">
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="logo-letter"
              initial={animateIn ? { y: 26, opacity: 0, rotateX: 80 } : false}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: animateIn ? 0.25 + i * 0.07 : 0, type: 'spring', stiffness: 220, damping: 14 }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </span>
        <span className="logo-shine" />
      </motion.div>
      {!compact && (
        <motion.div className="logo-pill" initial={animateIn ? { opacity: 0, scale: 0.8 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}>
          <b>GOOD</b> <b>MOOD</b> <b>FOOD</b>
        </motion.div>
      )}
    </div>
  );
}
