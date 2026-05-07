import { NextResponse } from 'next/server';
import { adminJson } from '@/lib/admin/api';
import { getAdminUser } from '@/lib/admin/getAdminUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'No tienes permisos de administrador' },
      { status: 403 }
    );
  }

  return adminJson(admin);
}
