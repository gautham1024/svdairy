import siteConfig from '../site.config';
import { getSocials } from './Socials';

export default function Footer({ settings }) {
  const socials = getSocials(settings);
  return (
    <footer className="footer">
      <div className="container">
        <img className="footer-logo" src="/logo.webp" alt="" width="110" height="89" loading="lazy" />
        <p className="footer-name">{siteConfig.businessName}</p>
        <p className="footer-tag">{siteConfig.tagline}</p>
        <nav className="footer-links" aria-label="Footer">
          <a href="#home">Home</a><a href="#products">Products</a><a href="#about">About</a><a href="#contact">Contact</a>
        </nav>
        {socials.length > 0 && (
          <div className="footer-socials">
            {socials.map(({ name, url, Icon }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>
                <Icon />
              </a>
            ))}
          </div>
        )}
        <p className="footer-copy">© {new Date().getFullYear()} {siteConfig.businessName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
