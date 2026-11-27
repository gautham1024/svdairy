'use client';
import { useEffect, useRef } from 'react';
import siteConfig from '../site.config';

export default function About({ settings }) {
  const fssai = settings?.fssaiNumber;
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  // Scroll scrubs the pinned video (cut from the ad at 0:59–1:09, logo cropped off like the hero)
  useEffect(() => {
    const sec = sectionRef.current, v = videoRef.current;
    let target = 0, cur = 0, raf = 0, last = 0;

    // Ease toward the scroll position so wheel/touch steps glide instead of jumping
    function tick(now) {
      const dt = Math.min(now - (last || now), 50); last = now;
      cur += (target - cur) * (1 - Math.exp(-dt / 70));
      if (Math.abs(target - cur) < 0.002) cur = target;
      if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - cur) > 0.001) v.currentTime = cur;
      raf = cur !== target || v.seeking ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    }
    function onScroll() {
      const r = sec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      target = p * (v.duration || 0);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    // iOS won't paint seeked frames until the video has been played once
    v.play()?.then(() => v.pause()).catch(() => {});
    v.addEventListener('loadedmetadata', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('loadedmetadata', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id="about" ref={sectionRef} className="about">
      <div className="about-stage" aria-hidden="true">
        <video ref={videoRef} className="about-video" muted playsInline preload="auto"
               poster="/videos/about-poster.webp" tabIndex={-1}>
          <source src="/videos/about-scrub.webm" type="video/webm" />
          <source src="/videos/about-scrub.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="container about-grid">
        <div className="about-copy">
          <span className="kicker">Our story</span>
          <h2>About Us</h2>
          <p>{siteConfig.about}</p>
          {fssai && <span className="fssai">FSSAI No: {fssai}</span>}
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
      <svg className="hero-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 C240,110 480,10 720,50 C960,90 1200,100 1440,40 L1440,100 L0,100 Z" />
      </svg>
    </section>
  );
}
