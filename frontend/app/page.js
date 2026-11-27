'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import siteConfig from '../site.config';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Products from '../components/Products';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Cart from '../components/Cart';
import { whatsappLink } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/Icons';
import useReveal from '../components/Reveal';

export default function Home() {
  const [settings, setSettings] = useState(null);
  // { [productId]: { id, name, packSize, price, qty } }, kept per browser tab, no sign-in
  const [cart, setCart] = useState({});
  const [cartReady, setCartReady] = useState(false);
  useReveal();

  // Settings are shared by Hero, Products, Cart and Contact, so fetch once here
  useEffect(() => {
    api('/api/settings').then(setSettings).catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    try { setCart(JSON.parse(sessionStorage.getItem('cart')) || {}); } catch {}
    setCartReady(true);
  }, []);
  useEffect(() => {
    if (cartReady) try { sessionStorage.setItem('cart', JSON.stringify(cart)); } catch {}
  }, [cart, cartReady]);

  const maxQty = settings?.maxCartQty || 10;
  function addToCart(p) {
    setCart((c) => {
      const qty = Math.min((c[p.id]?.qty || 0) + 1, maxQty);
      return { ...c, [p.id]: { id: p.id, name: p.name, packSize: p.packSize, price: p.price, qty } };
    });
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero settings={settings} />
        <Products settings={settings} cart={cart} onAdd={addToCart} maxQty={maxQty} />
        <About settings={settings} />
        <Contact settings={settings} />
      </main>
      <Footer settings={settings} />
      <Cart cart={cart} setCart={setCart} maxQty={maxQty} whatsappNumber={settings?.whatsappNumber} />
      {settings?.whatsappNumber && (
        <a className="wa-fab" aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer"
           href={whatsappLink(settings.whatsappNumber, `Hello ${siteConfig.businessName}!`)}>
          <WhatsAppIcon />
        </a>
      )}
    </>
  );
}
