/** @type {import('next').NextConfig} */
const nextConfig = {
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
