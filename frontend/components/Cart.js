'use client';
import { useEffect, useState } from 'react';
import siteConfig from '../site.config';
import { api } from '../lib/api';
import { whatsappLink } from './ProductCard';

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

export function buildMessage(items) {
  const lines = items.map((it, i) => `${i + 1}. ${it.name} (${it.packSize}) × ${it.qty} = ${rupees(it.price * it.qty)}`);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return `Hello ${siteConfig.businessName}!
I would like to order:
${lines.join('\n')}
Total: ${rupees(total)}
Please let me know the availability and delivery details. Thank you!`;
}

// Asked only when the customer orders. Cached per session; deny, error or 8s timeout resolves to {}.
function getLocation() {
  return new Promise((resolve) => {
    try {
      const address = sessionStorage.getItem('user_address');
      const coords = JSON.parse(sessionStorage.getItem('user_coords'));
      if (address && coords) return resolve({ address, ...coords });
      if (!navigator.geolocation) return resolve({});
    } catch { return resolve({}); }
    const timer = setTimeout(() => resolve({}), 8000);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const { latitude, longitude } = coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (!data.display_name) throw new Error('no address');
        sessionStorage.setItem('user_address', data.display_name);
        sessionStorage.setItem('user_coords', JSON.stringify({ latitude, longitude }));
        resolve({ address: data.display_name, latitude, longitude });
      } catch { resolve({}); }
      clearTimeout(timer);
    }, () => { clearTimeout(timer); resolve({}); }, { timeout: 7000 });
  });
}

export default function Cart({ cart, setCart, maxQty, whatsappNumber }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const items = Object.values(cart);
  const count = items.reduce((s, it) => s + it.qty, 0);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const setQty = (id, qty) => setCart((c) => {
    const next = { ...c };
    if (qty < 1) delete next[id];
    else next[id] = { ...next[id], qty: Math.min(qty, maxQty) };
    return next;
  });

  async function order() {
    setBusy(true);
    const loc = await getLocation();
    // Log first, never block the customer if it fails
    await api('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((it) => ({ productId: it.id, productName: `${it.name} (${it.packSize})`, qty: it.qty, price: it.price })),
        ...loc,
      }),
    }).catch(() => {});
    const link = whatsappLink(whatsappNumber, buildMessage(items));
    setCart({});
    setOpen(false);
    setBusy(false);
    // Same tab: window.open after an await is blocked as a popup
    window.location.href = link;
  }

  if (count === 0 && !open) return null;
  return (
    <>
      <button className="cart-fab" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
        🛒<span className="cart-badge">{count}</span>
      </button>
      {open && <div className="cart-backdrop" onClick={() => setOpen(false)} />}
      <aside className={open ? 'cart-drawer open' : 'cart-drawer'} aria-label="Cart" aria-hidden={!open} inert={!open}>
        <div className="cart-head">
          <h2>Your cart</h2>
          <button className="cart-close" onClick={() => setOpen(false)} aria-label="Close cart">✕</button>
        </div>
        {items.length === 0 && <p className="muted">Your cart is empty.</p>}
        <ul className="cart-list">
          {items.map((it) => (
            <li key={it.id} className="cart-line">
              <div className="cart-line-info">
                <strong>{it.name}</strong>
                <span className="muted">{it.packSize} · {rupees(it.price)}</span>
              </div>
              <div className="qty" role="group" aria-label={`Quantity of ${it.name}`}>
                <button onClick={() => setQty(it.id, it.qty - 1)} aria-label="Decrease">−</button>
                <span aria-live="polite">{it.qty}</span>
                <button onClick={() => setQty(it.id, it.qty + 1)} disabled={it.qty >= maxQty} aria-label="Increase">+</button>
              </div>
              <span className="cart-sub">{rupees(it.price * it.qty)}</span>
              <button className="cart-remove" onClick={() => setQty(it.id, 0)} aria-label={`Remove ${it.name}`}>✕</button>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <div className="cart-foot">
            <div className="cart-total"><span>Total</span><strong>{rupees(total)}</strong></div>
            <button className="btn btn-whatsapp" onClick={order} disabled={!whatsappNumber || busy}>
              {busy ? 'Opening WhatsApp…' : 'Order on WhatsApp'}
            </button>
            <p className="muted cart-note">Max {maxQty} per item.</p>
          </div>
        )}
      </aside>
    </>
  );
}

