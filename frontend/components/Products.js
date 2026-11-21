'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import ProductCard from './ProductCard';

export default function Products({ settings }) {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/products').then(setProducts).catch(() => setError('Could not load products. Please try again.'));
  }, []);

  return (
    <section id="products" className="section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Fresh from our dairy</span>
          <h2>Our Products</h2>
          <span className="ornament" aria-hidden="true"><i /></span>
        </div>
        {error && <p className="error empty">{error}</p>}
        {!error && products === null && (
          <div className="grid" aria-busy="true" aria-label="Loading products">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
          </div>
        )}
        {products && products.length === 0 && <p className="muted empty">Products coming soon. 🥛</p>}
        {products && products.length > 0 && (
          <div className="grid">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} whatsappNumber={settings?.whatsappNumber} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
