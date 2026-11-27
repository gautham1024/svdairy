import { useState } from 'react';

// Strip spaces, + and dashes so wa.me gets digits only.
// A bare 10-digit Indian number gets the 91 country code, otherwise wa.me rejects it.
export function whatsappLink(number, message) {
  let digits = String(number).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// variants: rows with the same name, one per pack size
export default function ProductCard({ variants, index = 0, cart, onAdd, maxQty }) {
  const [selected, setSelected] = useState(0);
  const [added, setAdded] = useState(false);
  const base = variants[0];
  const product = variants[selected] || base;
  const atMax = (cart?.[product.id]?.qty || 0) >= maxQty;

  function handleAdd() {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="card" style={{ '--i': index % 3 }}>
      <div className="card-media">
        <span className="chip">{product.packSize}</span>
        <img src={base.imageUrl} alt={base.name} loading="lazy" className="card-img"
             onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      </div>
      <div className="card-body">
        <h3>{base.name}</h3>
        {base.description && <p className="desc">{base.description}</p>}
        {variants.length > 1 && (
          <div className="sizes" role="group" aria-label="Choose quantity">
            {variants.map((v, i) => (
              <button key={v.id} type="button" className={i === selected ? 'size-btn active' : 'size-btn'}
                      aria-pressed={i === selected} onClick={() => setSelected(i)}>
                {v.packSize}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={atMax} aria-live="polite">
            {added ? 'Added ✓' : atMax ? `Max ${maxQty} added` : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
