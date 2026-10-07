import type { MetadataRoute } from 'next';
import { getSiteUrl, isRetrovilleStandalone } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const standalone = isRetrovilleStandalone();
  const disallowRules = [
    '/admin',
    '/retroville/admin',
    '/retroville/admin/',
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
    sitemap: standalone ? `${siteUrl}/sitemap.xml` : [`${siteUrl}/sitemap.xml`, `${siteUrl}/retroville/sitemap.xml`],
    host: siteUrl,
  };
}
