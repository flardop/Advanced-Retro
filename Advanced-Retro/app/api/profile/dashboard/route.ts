import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { loadProfileDashboard } from '@/lib/profileDashboard';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudo cargar el perfil' }, { status: 500 });
}

export async function GET() {
  try {
    const { user, profile } = await requireUserContext();
    const dashboard = await loadProfileDashboard(user.id, profile);
    return NextResponse.json(dashboard);
  } catch (error: any) {
    return handleError(error);
  }
}
