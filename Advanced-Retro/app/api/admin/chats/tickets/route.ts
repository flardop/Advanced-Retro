import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import {
  getSupportSetupErrorMessage,
  isSupportSetupMissing,
  listAdminTickets,
} from '@/lib/supportTickets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminContext();
    const tickets = await listAdminTickets();
    return NextResponse.json({ tickets });
  } catch (error: any) {
    if (isSupportSetupMissing(error)) {
      return NextResponse.json(
        {
          error: getSupportSetupErrorMessage(),
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
