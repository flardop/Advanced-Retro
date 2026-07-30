import { revalidatePath } from 'next/cache';
import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { regenerateRetrovilleSitemapSnapshot } from '@/lib/retroville-admin/data';

export async function POST() {
  return withRetrovilleAdminRoute(async () => {
    const payload = await regenerateRetrovilleSitemapSnapshot();
    revalidatePath('/sitemap.xml');
    revalidatePath('/retroville/sitemap.xml');
    revalidatePath('/retroville');
    return payload;
  });
}
