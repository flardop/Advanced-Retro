import { withAdminRoute } from '@/lib/admin/api';
import { getConcurrentSessionsSeries, listOnlineSessions } from '@/lib/admin/data';

export async function GET() {
  return withAdminRoute(async () => {
    const [sessions, timeline] = await Promise.all([listOnlineSessions(), getConcurrentSessionsSeries()]);
    return { sessions, timeline };
  });
}
