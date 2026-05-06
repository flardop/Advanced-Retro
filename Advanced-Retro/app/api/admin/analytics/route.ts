import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getAnalyticsSnapshot } from '@/lib/admin/data';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') || undefined;
  const to = request.nextUrl.searchParams.get('to') || undefined;
  return withAdminRoute(async () => getAnalyticsSnapshot({ from, to }));
}
