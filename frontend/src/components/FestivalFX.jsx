import { useMemo } from 'react';
import { EFFECTS } from '../themes';

// Lightweight falling-emoji overlay for festival themes (pure CSS animation, no canvas).
export default function FestivalFX({ effect }) {
  const symbols = EFFECTS[effect] || [];
  const bits = useMemo(
    () =>
      symbols.length
        ? Array.from({ length: 16 }, (_, i) => ({
            id: i,
            s: symbols[i % symbols.length],
            left: Math.round((i * 100) / 16 + Math.random() * 5),
            size: 14 + Math.round(Math.random() * 16),
            dur: 9 + Math.random() * 9,
            delay: -Math.random() * 14,
            sway: 20 + Math.random() * 40,
          }))
        : [],
    [effect] // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!bits.length) return null;
  return (
    <div className="fx" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className="fx-bit"
          style={{ left: `${b.left}%`, fontSize: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, '--sway': `${b.sway}px` }}
        >
          {b.s}
        </span>
      ))}
    </div>
  );
}
