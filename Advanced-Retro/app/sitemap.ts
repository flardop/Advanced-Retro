import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductHref } from '@/lib/productUrl';

const STATIC_ROUTES = [
  '/',
  '/tienda',
  '/subastas',
  '/ruleta',
  '/comunidad',
  '/comunidad/publicar',
  '/servicio-compra',
  '/contacto',
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
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5000);

  const productEntries: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
    url: `${siteUrl}${getProductHref(product)}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const communityEntries: MetadataRoute.Sitemap = [];

  const { data: communityListings } = await supabaseAdmin
    .from('user_product_listings')
    .select('id,user_id,updated_at,created_at,status')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(5000);

  const sellerIds = new Set<string>();
  for (const listing of communityListings || []) {
    const listingId = String((listing as any)?.id || '').trim();
    const sellerId = String((listing as any)?.user_id || '').trim();
    if (!listingId) continue;
    if (sellerId) sellerIds.add(sellerId);

    communityEntries.push({
      url: `${siteUrl}/comunidad/anuncio/${encodeURIComponent(listingId)}`,
      lastModified: (listing as any)?.updated_at
        ? new Date(String((listing as any).updated_at))
        : (listing as any)?.created_at
          ? new Date(String((listing as any).created_at))
          : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const sellerId of sellerIds) {
    communityEntries.push({
      url: `${siteUrl}/comunidad/vendedor/${encodeURIComponent(sellerId)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return [...staticEntries, ...productEntries, ...communityEntries];
}
