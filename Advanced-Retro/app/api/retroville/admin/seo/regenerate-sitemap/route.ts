import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { regenerateRetrovilleSitemapSnapshot } from '@/lib/retroville-admin/data';

export async function POST() {
  return withRetrovilleAdminRoute(async () => regenerateRetrovilleSitemapSnapshot());
}
