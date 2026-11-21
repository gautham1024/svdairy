import siteConfig from '../site.config';
import { api } from '../lib/api';
import { WhatsAppIcon } from './Icons';

// Strip spaces, + and dashes so wa.me gets digits only.
// A bare 10-digit Indian number gets the 91 country code, otherwise wa.me rejects it.
export function whatsappLink(number, message) {
  let digits = String(number).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildMessage(p) {
  return `Hello ${siteConfig.businessName}! 👋
I would like to order:
Product: ${p.name} (${p.packSize})
Price: ₹${p.price}
Please let me know the availability and delivery details. Thank you!`;
}

// Cloudinary transform keeps images small
const optimise = (url) => url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');

export default function ProductCard({ product, whatsappNumber, index = 0 }) {
  function handleBuy() {
    // Log first, never block the customer if it fails
    api('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, productName: product.name }),
    }).catch(() => {});
    window.open(whatsappLink(whatsappNumber, buildMessage(product)), '_blank', 'noopener');
  }

  return (
    <article className="card" style={{ '--i': index }}>
      <div className="card-media">
        <span className="chip">{product.packSize}</span>
        <img src={optimise(product.imageUrl)} alt={product.name} loading="lazy" className="card-img" />
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        {product.description && <p className="desc">{product.description}</p>}
        <div className="card-foot">
          <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
          <button className="btn btn-whatsapp btn-sm" onClick={handleBuy} disabled={!whatsappNumber}>
            <WhatsAppIcon /> Buy on WhatsApp
          </button>
        </div>
      </div>
    </article>
  );
}
