import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getDashboardSnapshot } from '@/lib/admin/data';

export async function GET(request: NextRequest) {
  const range = (request.nextUrl.searchParams.get('range') as '7d' | '30d' | '90d' | '1y' | null) || '30d';
  return withAdminRoute(async () => getDashboardSnapshot(range));
}
