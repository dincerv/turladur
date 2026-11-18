import type { MetadataRoute } from 'next';

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://turladur-zjyf.vercel.app'
  ).replace(/\/$/, '');
}

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/acente/',
          '/admin/',
          '/rehber/',
          '/otobus/',
          '/checkout',
          '/bookings',
          '/profile',
          '/api/',
          '/dev/',
          '/partner-register',
          '/partner-verification',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
