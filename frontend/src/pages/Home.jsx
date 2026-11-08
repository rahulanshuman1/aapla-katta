import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import Editable from '../components/Editable';
import AnimatedLogo from '../components/AnimatedLogo';
import DishCard from '../components/DishCard';

const reveal = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.55 } };
const PLATE = ['🍛', '🥘', '🫓', '🍜', '🧀', '🥟', '🍚', '🥞'];

export default function Home() {
  const { settings, loadMenu, menu, text } = useApp();
  const { contact, brand } = settings;
  const [err, setErr] = useState(false);

  useEffect(() => { loadMenu().catch(() => setErr(true)); }, [loadMenu]);

  const popular = (menu || []).flatMap((c) => c.items.filter((i) => i.popular && i.available).map((i) => ({ ...i, _emoji: c.icon }))).slice(0, 8);
  const phone = contact.phone.replace(/\s/g, '');

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-grid">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <Editable k="hero.eyebrow" as="span" className="eyebrow" />
            <Editable k="hero.title" as="h1" className="hero-title" />
            <Editable k="hero.subtitle" as="p" className="hero-sub" />
            <div className="hero-cta">
              <Link to="/menu" className="btn btn-primary btn-lg"><Editable k="hero.cta1" /></Link>
              <Link to="/menu" className="btn btn-outline btn-lg"><Editable k="hero.cta2" /></Link>
            </div>
            <div className="hero-badges">
              <Editable k="hero.badge1" as="span" className="chip" />
              <Editable k="hero.badge2" as="span" className="chip" />
            </div>
          </motion.div>

          <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {brand.heroImage ? (
              <div className="hero-photo"><img src={brand.heroImage} alt={`${brand.name} food`} /></div>
            ) : (
              <div className="thali">
                <div className="thali-ring">
                  {PLATE.map((e, i) => (
                    <span key={i} className="thali-item" style={{ '--i': i, '--n': PLATE.length }}><span className="thali-emoji">{e}</span></span>
                  ))}
                </div>
                <div className="thali-center"><AnimatedLogo variant="hero" /></div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((n) => <span key={n}>{text('marquee.text')}  •  </span>)}
          {[2, 3].map((n) => <span key={n}>{text('marquee.text')}  •  </span>)}
        </div>
      </div>

      {/* ---------- POPULAR ---------- */}
      <section className="section">
        <div className="container">
          <motion.div className="section-head" {...reveal}>
            <Editable k="popular.title" as="h2" />
            <Editable k="popular.subtitle" as="p" className="muted" />
          </motion.div>
          {err && <p className="alert err">Could not load the menu. The server may be waking up – please refresh in a few seconds.</p>}
          {!menu && !err && <div className="center"><div className="spinner" /></div>}
          <div className="grid-cards">
            {popular.map((it) => <DishCard key={it._id} item={it} emoji={it._emoji} layout="card" />)}
          </div>
          <div className="center" style={{ marginTop: 28 }}><Link to="/menu" className="btn btn-primary">See full menu →</Link></div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="section section-alt">
        <div className="container">
          <motion.div className="section-head" {...reveal}><Editable k="features.title" as="h2" /></motion.div>
          <div className="features">
            {[['🫒', 1], ['📖', 2], ['👨‍👩‍👧‍👦', 3]].map(([icon, n]) => (
              <motion.div key={n} className="feature" {...reveal} whileHover={{ y: -6 }}>
                <div className="feature-icon">{icon}</div>
                <Editable k={`features.${n}.title`} as="h3" />
                <Editable k={`features.${n}.text`} as="p" className="muted" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="section">
        <div className="container">
          <motion.div className="section-head" {...reveal}><Editable k="categories.title" as="h2" /></motion.div>
          <div className="cat-grid">
            {(menu || []).map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                <Link to={`/menu#${c.slug}`} className="cat-tile">
                  <span className="cat-emoji">{c.icon}</span>
                  <b>{c.name}</b>
                  <small>{c.items.length} items</small>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CATERING ---------- */}
      <section className="section" id="catering">
        <div className="container">
          <motion.div className="catering" {...reveal}>
            <div>
              <Editable k="catering.title" as="h2" />
              <Editable k="catering.text" as="p" />
            </div>
            <a className="btn btn-gold btn-lg catering-btn" href={`tel:${phone}`}><span aria-hidden="true">📞</span><span className="catering-btn-text"><Editable k="catering.cta" /> <b className="nowrap catering-phone">{contact.phone}</b></span></a>
          </motion.div>
        </div>
      </section>

      {/* ---------- VISIT ---------- */}
      <section className="section section-alt" id="visit">
        <div className="container">
          <motion.div className="section-head" {...reveal}><Editable k="visit.title" as="h2" /></motion.div>
          <div className="visit-grid">
            <motion.div className="card" {...reveal}>
              <div className="info-row"><span>📍</span><div><b>Address</b><p>{contact.address}</p></div></div>
              <div className="info-row"><span>⏰</span><div><b>Hours</b><p>{contact.hours}</p></div></div>
              <div className="info-row"><span>📞</span><div><b>Call us</b><p><a href={`tel:${phone}`}>{contact.phone}</a></p></div></div>
              {contact.instagram && <div className="info-row"><span>📸</span><div><b>Instagram</b><p><a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">@{contact.instagram}</a></p></div></div>}
              <div className="partners">
                <small>Also order on</small>
                <span className="partner swiggy">Swiggy</span>
                <span className="partner zomato">Zomato</span>
              </div>
              <div className="visit-actions">
                {contact.mapUrl && <a className="btn btn-primary btn-sm" href={contact.mapUrl} target="_blank" rel="noreferrer">Get directions</a>}
                {contact.whatsapp && <a className="btn btn-outline btn-sm" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
              </div>
            </motion.div>
            <motion.div className="card notes" {...reveal}>
              <Editable k="visit.notes.title" as="h3" />
              <ul>{[1, 2, 3, 4, 5, 6].map((n) => <li key={n}><Editable k={`visit.note.${n}`} /></li>)}</ul>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
