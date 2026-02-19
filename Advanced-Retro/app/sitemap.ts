import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const STATIC_ROUTES = [
  '/',
  '/tienda',
  '/ruleta',
  '/servicio-compra',
  '/contacto',
  '/perfil',
  '/carrito',
  '/checkout',
  '/terminos',
  '/privacidad',
  '/cookies',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  if (!supabaseAdmin) {
    return staticEntries;
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5000);

  const productEntries: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
    url: `${siteUrl}/producto/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
