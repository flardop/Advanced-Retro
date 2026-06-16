import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const disallowRules = [
    '/admin',
    '/dashboard/',
    '/admin/test-images',
    '/admin/update-images',
    '/crear-tienda',
    '/memberships/manage',
    '/dev-retroville',
    '/dev-retroville/',
    '/login',
    '/perfil',
    '/carrito',
    '/checkout',
    '/pedido/confirmacion',
    '/success',
    '/test-images',
    '/update-images',
    '/api/',
  ];

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowRules,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: disallowRules,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowRules,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
