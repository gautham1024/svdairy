import siteConfig from '../site.config';

export default function About() {
  return (
    <section id="about" className="section cream">
      <div className="container about-grid">
        <div className="about-copy">
          <span className="kicker">Our story</span>
          <h2>About Us</h2>
          <p>{siteConfig.about}</p>
          <span className="fssai">{siteConfig.fssai}</span>
        </div>
        <div className="trust">
          {siteConfig.trustPoints.map((t) => (
            <div key={t.title} className="trust-item">
              <span className="trust-icon" aria-hidden="true">{t.icon}</span>
              <div>
                <h3>{t.title}</h3>
                <p className="muted">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
