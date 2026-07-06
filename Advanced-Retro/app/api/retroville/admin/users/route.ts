import { NextRequest } from 'next/server';
import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminUsersData } from '@/lib/retroville-admin/data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return withRetrovilleAdminRoute(async () =>
    getRetrovilleAdminUsersData({
      page: Number(searchParams.get('page') || 1),
      search: searchParams.get('search') || '',
      profile: searchParams.get('profile') || '',
      status: searchParams.get('status') || '',
      sort: searchParams.get('sort') || 'created_at',
      direction: searchParams.get('direction') === 'asc' ? 'asc' : 'desc',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
    })
  );
}
