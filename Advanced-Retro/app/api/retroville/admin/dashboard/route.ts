import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminDashboardData } from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminDashboardData());
}
