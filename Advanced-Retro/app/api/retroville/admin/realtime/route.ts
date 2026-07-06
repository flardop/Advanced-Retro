import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminRealtimeData } from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminRealtimeData());
}
