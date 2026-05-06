import { withAdminRoute } from '@/lib/admin/api';
import { getLiveActivityFeed } from '@/lib/admin/data';

export async function GET() {
  return withAdminRoute(async () => getLiveActivityFeed());
}
