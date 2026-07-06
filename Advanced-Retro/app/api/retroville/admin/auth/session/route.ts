import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';

export async function GET() {
  return withRetrovilleAdminRoute(async (context) => ({
    user: context.user,
    session: context.session,
  }));
}
