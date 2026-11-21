import { FacebookIcon, InstagramIcon, YouTubeIcon } from './Icons';

// Settings URLs are free text from the admin panel, so "instagram.com/abc" must still work
export function normaliseUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, '')}`;
}

// Returns [{ name, url, Icon }] for the links the admin has filled in
export function getSocials(settings) {
  const s = settings || {};
  return [
    ['Facebook', s.facebookUrl, FacebookIcon],
    ['Instagram', s.instagramUrl, InstagramIcon],
    ['YouTube', s.youtubeUrl, YouTubeIcon],
  ]
    .map(([name, url, Icon]) => ({ name, url: normaliseUrl(url), Icon }))
    .filter((x) => x.url);
}
