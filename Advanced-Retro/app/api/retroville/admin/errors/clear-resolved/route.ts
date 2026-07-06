import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { clearRetrovilleResolvedErrors } from '@/lib/retroville-admin/data';

export async function POST() {
  return withRetrovilleAdminRoute(async () => clearRetrovilleResolvedErrors());
}
