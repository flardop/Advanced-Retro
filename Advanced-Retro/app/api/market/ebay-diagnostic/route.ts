import { NextResponse } from 'next/server';
import { runEbayDiagnostics } from '@/lib/ebayBrowse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = String(url.searchParams.get('q') || '').trim();
    const diagnostics = await runEbayDiagnostics(query || undefined);
    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'No se pudo ejecutar el diagnóstico de eBay',
        hint: 'Prueba /api/market/ebay-diagnostic?q=pokemon+yellow+game+boy',
      },
      { status: 500 }
    );
  }
}

