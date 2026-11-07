import type { NextConfig } from 'next';

const apiUpstream =
  process.env.API_PROXY_TARGET?.trim() || 'http://localhost:4000';

const nextConfig: NextConfig = {
  // Sprint 25.8 — lint + typecheck both enforced on build.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    // P0-B: legacy partner URLs → acente
    return [
      {
        source: '/partner-login',
        destination: '/acente/giris',
        permanent: false,
      },
      {
        source: '/partner',
        destination: '/acente/dashboard',
        permanent: false,
      },
      {
        source: '/partner/:path*',
        destination: '/acente/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Same-origin /api/v1 → Nest — HttpOnly refresh cookie (SameSite=Lax) works.
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUpstream.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      // Sprint 23.19 — Cloudflare CDN / R2 custom domain
      { protocol: 'https', hostname: 'media.turta.com' },
      { protocol: 'https', hostname: 'media.turta.com.tr' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      // Dev media proxy (Nest → R2) when r2.dev TLS is broken / no custom domain
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/api/v1/storage/media/**',
      },
      // Soft launch hosts (API media proxy as CDN)
      {
        protocol: 'https',
        hostname: '**.railway.app',
        pathname: '/api/v1/storage/media/**',
      },
      {
        protocol: 'https',
        hostname: '**.up.railway.app',
        pathname: '/api/v1/storage/media/**',
      },
      {
        protocol: 'https',
        hostname: '**.fly.dev',
        pathname: '/api/v1/storage/media/**',
      },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
  transpilePackages: ['react-leaflet', 'leaflet'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
