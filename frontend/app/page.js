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
import { whatsappLink } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/Icons';
import useReveal from '../components/Reveal';

export default function Home() {
  const [settings, setSettings] = useState(null);
  useReveal();

  // Settings are shared by Hero, Products (WhatsApp link) and Contact, so fetch once here
  useEffect(() => {
    api('/api/settings').then(setSettings).catch(() => setSettings({}));
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero settings={settings} />
        <Products settings={settings} />
        <About />
        <Contact settings={settings} />
      </main>
      <Footer settings={settings} />
      {settings?.whatsappNumber && (
        <a className="wa-fab" aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer"
           href={whatsappLink(settings.whatsappNumber, `Hello ${siteConfig.businessName}! 👋`)}>
          <WhatsAppIcon />
        </a>
      )}
    </>
  );
}
