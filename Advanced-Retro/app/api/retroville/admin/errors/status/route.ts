import { NextRequest } from 'next/server';
import { jsonRetrovilleAdminError, withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { updateRetrovilleAdminErrorStatus } from '@/lib/retroville-admin/data';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const occurrenceKey = String(payload.occurrenceKey || '').trim();
    const status = String(payload.status || 'new') as 'new' | 'reviewed' | 'resolved';

    return withRetrovilleAdminRoute(async () => updateRetrovilleAdminErrorStatus(occurrenceKey, status));
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
