/** @type {import('next').NextConfig} */
const nextPublicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.ANON ||
  '';
const nextPublicStripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';

const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: nextPublicStripePublishableKey,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'gbxtreme.com' },
      { protocol: 'https', hostname: '*.gbxtreme.com' },
      { protocol: 'https', hostname: 'splash.games.directory' },
      { protocol: 'https', hostname: 'thumbnails.libretro.com' },
      { protocol: 'https', hostname: 'images.igdb.com' },
    ],
  },
};

module.exports = nextConfig;
