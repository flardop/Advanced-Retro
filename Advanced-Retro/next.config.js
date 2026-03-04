const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextPublicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.ANON ||
  '';
const nextPublicStripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
const configuredSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';

function getHostnameFromUrl(input) {
  if (!input || typeof input !== 'string') return '';
  try {
    return new URL(input).hostname;
  } catch {
    return '';
  }
}

const configuredSupabaseHost = getHostnameFromUrl(configuredSupabaseUrl);
const allowedImageHosts = [
  configuredSupabaseHost,
  '**.supabase.co',
  'images.unsplash.com',
  'gbxtreme.com',
  'www.gbxtreme.com',
  'splash.games.directory',
  'thumbnails.libretro.com',
  'images.igdb.com',
  'upload.wikimedia.org',
  'i.ytimg.com',
].filter(Boolean);

const remotePatterns = Array.from(new Set(allowedImageHosts)).map((hostname) => ({
  protocol: 'https',
  hostname,
  pathname: '/**',
}));

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://api.stripe.com https://checkout.stripe.com https://api.ebay.com https://api.sandbox.ebay.com https://*.supabase.co",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: nextPublicStripePublishableKey,
  },
  images: {
    // Use Next.js optimizer in production for better LCP and bandwidth.
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: contentSecurityPolicyReportOnly,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
