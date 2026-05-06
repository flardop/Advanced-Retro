import { NextResponse } from 'next/server';
import { checkAdminSession, jsonAdminError } from '@/lib/admin/checkAdminSession';
import type { AdminApiResponse } from '@/types/admin';
import { serverLogError } from '@/lib/admin/serverErrorLogger';

export function adminJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<AdminApiResponse<T>>({ success: true, data }, init);
}

export async function withAdminRoute<T>(handler: (ctx: Awaited<ReturnType<typeof checkAdminSession>>) => Promise<T>) {
  try {
    const session = await checkAdminSession();
    const data = await handler(session);
    return adminJson(data);
  } catch (error) {
    await serverLogError(error, { source: 'admin-route' }).catch(() => null);
    return jsonAdminError(error);
  }
}
