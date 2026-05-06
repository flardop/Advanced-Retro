import { withAdminRoute } from '@/lib/admin/api';
import { getErrorLogSnapshot } from '@/lib/admin/data';

export async function GET() {
  return withAdminRoute(async () => getErrorLogSnapshot());
}
