'use client';
import { useEffect, useState } from 'react';
import siteConfig from '../site.config';

const links = [['Home', '#home'], ['Products', '#products'], ['About', '#about'], ['Contact', '#contact']];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={scrolled ? 'navbar scrolled' : 'navbar'}>
      <div className="container nav-inner">
        <a href="#home" className="brand" aria-label={siteConfig.businessName}>
          <img src="/logo.webp" alt="" className="brand-logo" width="59" height="48" />
          <span className="brand-text">
            <small>{siteConfig.brandTop}</small>
            <strong>{siteConfig.brandBottom}</strong>
          </span>
        </a>
        <button className={open ? 'burger open' : 'burger'} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav className={open ? 'nav-links open' : 'nav-links'}>
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
