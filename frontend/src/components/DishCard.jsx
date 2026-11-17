import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import { inr } from '../api';

const TAGS = { spicy: ['🌶️', 'Spicy'], sweet: ['🍯', 'Sweet gravy'], chef: ['👨‍🍳', "Chef's pick"] };

/** One menu row / card with add-to-cart, Half/Full toggle and quantity stepper. */
export default function DishCard({ item, emoji = '🍽️', layout = 'row' }) {
  const { addToCart, cart, changeQty, toast } = useApp();
  const hasVariants = item.variants?.length > 0;
  const [variant, setVariant] = useState(hasVariants ? item.variants[0].label : '');
  const v = hasVariants ? item.variants.find((x) => x.label === variant) : null;
  const price = v ? v.price : item.price;
  const key = item._id + '|' + (v?.label || '');
  const line = cart.find((l) => l.key === key);

  const add = () => { addToCart(item, variant); if (!line) toast(`${item.name} added 🛒`); };

  return (
    <motion.div className={`dish dish-${layout} ${!item.available ? 'soldout' : ''}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.35 }}>
      <div className={`dish-thumb ${item.image ? 'has-img' : ''}`}>
        {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span>{emoji}</span>}
        <i className={`veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} title={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'} />
      </div>
      <div className="dish-body">
        <div className="dish-title">
          <h4>{item.name}</h4>
          {item.popular && <span className="chip chip-pop">⭐ Popular</span>}
          {(item.tags || []).map((t) => TAGS[t] && <span key={t} className="tag" title={TAGS[t][1]}>{TAGS[t][0]}</span>)}
        </div>
        {item.description && <p className="dish-desc">{item.description}</p>}
        {hasVariants && (
          <div className="seg">
            {item.variants.map((x) => (
              <button key={x.label} className={x.label === variant ? 'on' : ''} onClick={() => setVariant(x.label)}>{x.label} · {inr(x.price)}</button>
            ))}
          </div>
        )}
      </div>
      <div className="dish-side">
        <div className="price">{inr(price)}</div>
        {!item.available ? (
          <span className="chip chip-off">Sold out</span>
        ) : line ? (
          <div className="stepper">
            <button onClick={() => changeQty(key, -1)} aria-label="Decrease">−</button>
            <span>{line.qty}</span>
            <button onClick={() => changeQty(key, 1)} aria-label="Increase">+</button>
          </div>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={add}>Add +</button>
        )}
      </div>
    </motion.div>
  );
}
