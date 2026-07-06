import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminUserDetail } from '@/lib/retroville-admin/data';

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminUserDetail(context.params.id));
}
