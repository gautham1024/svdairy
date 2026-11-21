import './styles.css';
import siteConfig from '../site.config';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: `${siteConfig.businessName} | Fresh Milk & Dairy Products`,
  description: siteConfig.tagline,
  openGraph: {
    title: siteConfig.businessName,
    description: siteConfig.tagline,
    type: 'website',
    images: [{ url: '/logo.webp', width: 760, height: 615, alt: siteConfig.businessName }],
  },
};

export const viewport = { themeColor: '#0d3318' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: siteConfig.businessName,
  description: siteConfig.tagline,
  openingHours: siteConfig.hours,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
