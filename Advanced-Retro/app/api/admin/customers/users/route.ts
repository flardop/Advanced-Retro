import { withAdminRoute } from '@/lib/admin/api';
import { listAdminUsers } from '@/lib/admin/data';

export async function GET() {
  return withAdminRoute(async () => listAdminUsers());
}
