import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store';
import { inr } from '../api';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, changeQty, cartTotal, clearCart, user, settings } = useApp();
  const nav = useNavigate();
  const go = () => {
    setCartOpen(false);
    nav(user ? '/checkout' : '/login?next=/checkout');
  };
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside className="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}>
            <div className="drawer-head">
              <h3>Your order</h3>
              <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close">✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty"><div className="empty-emoji">🍽️</div><p>Your cart is empty.<br />Add something delicious!</p></div>
            ) : (
              <>
                <div className="drawer-body">
                  {cart.map((l) => (
                    <motion.div layout key={l.key} className="cart-line">
                      <div className="cart-line-info">
                        <b>{l.name}</b>
                        {l.variant && <small>{l.variant}</small>}
                        <span>{inr(l.price)}</span>
                      </div>
                      <div className="stepper">
                        <button onClick={() => changeQty(l.key, -1)} aria-label="Decrease">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => changeQty(l.key, 1)} aria-label="Increase">+</button>
                      </div>
                      <div className="cart-line-total">{inr(l.price * l.qty)}</div>
                    </motion.div>
                  ))}
                  <button className="link-btn" onClick={clearCart}>Clear cart</button>
                </div>
                <div className="drawer-foot">
                  <div className="row"><span>Subtotal</span><b>{inr(cartTotal)}</b></div>
                  <small className="muted">Taxes & delivery fee (if any) are added at checkout.</small>
                  {!settings.charges.acceptingOrders && <p className="alert err">We're not accepting online orders right now.</p>}
                  <button className="btn btn-primary btn-block" disabled={!settings.charges.acceptingOrders} onClick={go}>Checkout →</button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
