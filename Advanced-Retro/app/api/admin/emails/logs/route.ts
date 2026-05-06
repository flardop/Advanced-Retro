import { withAdminRoute } from '@/lib/admin/api';
import { getEmailLogs } from '@/lib/admin/data';

export async function GET() {
  return withAdminRoute(async () => getEmailLogs());
}
