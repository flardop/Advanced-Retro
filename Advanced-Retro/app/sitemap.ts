import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductHref } from '@/lib/productUrl';
import { BLOG_POSTS } from '@/lib/blogPosts';
import { PLATFORM_LANDING_SLUGS } from '@/lib/platformSeo';
import { listRetroStorageAuctions } from '@/lib/retroStorageAuctions';

const STATIC_ROUTES = [
  '/',
  '/tienda',
  '/mystery-boxes',
  '/subastas',
  '/ruleta',
  '/retroville',
  '/retroville/faq',
  '/retroville/legal',
  '/retroville/personajes',
  '/retroville/press',
  '/retroville/presentaciones',
  '/retroville/sketches',
  '/creator',
  '/memberships',
  '/tiendas',
  '/comunidad',
  '/blog',
  '/verificacion',
  '/servicio-compra',
  '/contacto',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/accesibilidad',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency:
      path === '/' || path === '/tienda' || path === '/retroville'
        ? 'daily'
        : path.startsWith('/retroville/')
          ? 'weekly'
          : 'weekly',
    priority:
      path === '/'
        ? 1
        : path === '/tienda'
          ? 0.95
          : path === '/retroville'
            ? 0.92
            : path.startsWith('/retroville/')
              ? 0.84
              : path === '/comunidad'
                ? 0.85
                : 0.7,
  }));

  const platformEntries: MetadataRoute.Sitemap = PLATFORM_LANDING_SLUGS.map((slug) => ({
    url: `${siteUrl}/tienda/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.78,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.72,
  }));

  const auctions = await listRetroStorageAuctions();
  const auctionEntries: MetadataRoute.Sitemap = auctions.map((auction) => ({
    url: `${siteUrl}/subastas/${auction.slug}`,
    lastModified: auction.effectiveEndsAt ? new Date(auction.effectiveEndsAt) : now,
    changeFrequency: auction.status === 'live' ? 'daily' : auction.status === 'upcoming' ? 'weekly' : 'monthly',
    priority: auction.status === 'live' ? 0.76 : 0.68,
  }));

  if (!supabaseAdmin) {
    return [...staticEntries, ...platformEntries, ...blogEntries, ...auctionEntries];
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

  return [...staticEntries, ...platformEntries, ...blogEntries, ...auctionEntries, ...productEntries];
}
