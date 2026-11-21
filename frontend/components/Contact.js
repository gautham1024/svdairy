import siteConfig from '../site.config';
import { whatsappLink } from './ProductCard';
import { WhatsAppIcon } from './Icons';
import { getSocials } from './Socials';

export default function Contact({ settings }) {
  const s = settings || {};
  const socials = getSocials(s);
  const telHref = s.phone ? `tel:${String(s.phone).replace(/[^\d+]/g, '')}` : '';
  const mapsHref = s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : '';
  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Get in touch</span>
          <h2>Contact Us</h2>
          <span className="ornament" aria-hidden="true"><i /></span>
        </div>
        <div className={siteConfig.mapEmbedUrl ? 'contact-grid' : 'contact-grid no-map'}>
          <div className="contact-list">
            {s.address && (
              <div className="contact-item">
                <span className="trust-icon" aria-hidden="true">📍</span>
                <div>
                  <strong>Address</strong>
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer">{s.address}</a>
                </div>
              </div>
            )}
            {s.phone && (
              <div className="contact-item">
                <span className="trust-icon" aria-hidden="true">📞</span>
                <div><strong>Phone</strong><a href={telHref}>{s.phone}</a></div>
              </div>
            )}
            <div className="contact-item">
              <span className="trust-icon" aria-hidden="true">🕒</span>
              <div><strong>Hours</strong>{siteConfig.hours}</div>
            </div>
            {socials.length > 0 && (
              <div className="contact-item">
                <span className="trust-icon" aria-hidden="true">💛</span>
                <div>
                  <strong>Follow us</strong>
                  <div className="socials">
                    {socials.map(({ name, url, Icon }) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
                        <Icon /> {name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {s.whatsappNumber && (
              <a className="btn btn-whatsapp" target="_blank" rel="noopener noreferrer"
                 href={whatsappLink(s.whatsappNumber, `Hello ${siteConfig.businessName}! 👋`)}>
                <WhatsAppIcon /> Chat on WhatsApp
              </a>
            )}
          </div>
          {siteConfig.mapEmbedUrl && (
            <iframe className="map" src={siteConfig.mapEmbedUrl} title="Our location" loading="lazy" />
          )}
        </div>
      </div>
    </section>
  );
}
