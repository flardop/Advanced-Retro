import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/siteConfig';
import { getRetrovillePageRegistry, isRetrovillePageInSitemap } from '@/lib/retroville-admin/page-registry';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const registry = await getRetrovillePageRegistry();

  return registry
    .filter((entry) => isRetrovillePageInSitemap(entry.path))
    .map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: entry.lastModified ? new Date(entry.lastModified) : now,
      changeFrequency: entry.path === '/retroville' ? 'daily' : 'weekly',
      priority: entry.path === '/retroville' ? 0.92 : entry.path === '/retroville/sketches' ? 0.86 : 0.84,
    }));
}
