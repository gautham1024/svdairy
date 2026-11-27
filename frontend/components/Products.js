'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import ProductCard from './ProductCard';

// Each size is its own DB row; rows with the same name share one card, cheapest size first
function groupByName(products) {
  const groups = new Map();
  for (const p of products) {
    const key = p.name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  return [...groups.values()].map((g) => g.sort((a, b) => a.price - b.price));
}

export default function Products({ cart, onAdd, maxQty }) {
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
            {groupByName(products).map((variants, i) => (
              <ProductCard key={variants[0].id} variants={variants} index={i} cart={cart} onAdd={onAdd} maxQty={maxQty} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
