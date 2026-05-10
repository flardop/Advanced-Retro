import { NextResponse } from 'next/server';
import { adminJson } from '@/lib/admin/api';
import { getAdminUser } from '@/lib/admin/getAdminUser';

export const dynamic = 'force-dynamic';

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function GET(request: Request) {
  const admin = await getAdminUser(getBearerToken(request) || undefined);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'No tienes permisos de administrador' },
      { status: 403 }
    );
  }

  return adminJson(admin);
}
