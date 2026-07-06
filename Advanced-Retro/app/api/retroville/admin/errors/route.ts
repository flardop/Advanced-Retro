import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminErrorsData } from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminErrorsData());
}
