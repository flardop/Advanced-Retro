import { NextRequest } from 'next/server';
import { withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { getRetrovilleAdminPageAnalyticsData } from '@/lib/retroville-admin/data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return withRetrovilleAdminRoute(async () =>
    getRetrovilleAdminPageAnalyticsData({
      preset:
        searchParams.get('preset') === 'today' ||
        searchParams.get('preset') === '7d' ||
        searchParams.get('preset') === '30d' ||
        searchParams.get('preset') === 'custom'
          ? (searchParams.get('preset') as 'today' | '7d' | '30d' | 'custom')
          : '30d',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
    })
  );
}
