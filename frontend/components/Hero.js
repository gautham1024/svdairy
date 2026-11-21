import siteConfig from '../site.config';
import { whatsappLink } from './ProductCard';
import { WhatsAppIcon } from './Icons';

export default function Hero({ settings }) {
  const wa = settings?.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, `Hello ${siteConfig.businessName}! 👋`)
    : null;
  return (
    <section id="home" className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{siteConfig.eyebrow}</span>
          <h1>{siteConfig.heroText}</h1>
          <p>{siteConfig.tagline}</p>
          <div className="hero-actions">
            <a className="btn btn-gold" href="#products">View Products</a>
            {wa && (
              <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Chat on WhatsApp
              </a>
            )}
          </div>
          <ul className="hero-badges">
            {siteConfig.trustPoints.map((t) => <li key={t.title}>{t.title}</li>)}
          </ul>
        </div>
        <div className="hero-art">
          <div className="halo" aria-hidden="true" />
          <img className="hero-logo" src="/logo.webp" alt={siteConfig.businessName} width="760" height="615" />
        </div>
      </div>
      <svg className="hero-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 C240,110 480,10 720,50 C960,90 1200,100 1440,40 L1440,100 L0,100 Z" />
      </svg>
    </section>
  );
}
