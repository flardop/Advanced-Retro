import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminSeoData } from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminSeoData());
}
