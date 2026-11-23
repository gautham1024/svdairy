'use client';
import { useEffect } from 'react';

const SELECTOR = '.section-head, .card, .about-copy, .trust-item, .contact-item, .map';

// Fade-and-rise each matching element once, the first time it scrolls into view.
// A MutationObserver picks up product cards that arrive after the API call.
export default function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Per-run set, not a marker on the element: StrictMode runs this effect twice and a leftover marker left the first run's elements unobserved
    const seen = new WeakSet();
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.classList.add('reveal');
      io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}
