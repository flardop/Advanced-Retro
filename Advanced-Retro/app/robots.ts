import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/test-images',
          '/admin/update-images',
          '/login',
          '/perfil',
          '/carrito',
          '/checkout',
          '/success',
          '/test-images',
          '/update-images',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
