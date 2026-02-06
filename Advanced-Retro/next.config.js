/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'gbxtreme.com' },
      { protocol: 'https', hostname: '*.gbxtreme.com' },
      { protocol: 'https', hostname: 'splash.games.directory' },
    ],
  },
};

module.exports = nextConfig;
