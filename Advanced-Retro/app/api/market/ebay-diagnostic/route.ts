import { NextResponse } from 'next/server';
import { runEbayDiagnostics } from '@/lib/ebayBrowse';
import { getRequestDurationMs, getRequestStartTimeMs, logApiPerformanceEvent } from '@/lib/performanceMetrics';

export const dynamic = 'force-dynamic';
const ENDPOINT = '/api/market/ebay-diagnostic';

export async function GET(req: Request) {
  const startMs = getRequestStartTimeMs();
  const respond = (body: unknown, status = 200) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'GET',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit: null,
    });
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  };

  try {
    const url = new URL(req.url);
    const query = String(url.searchParams.get('q') || '').trim();
    const diagnostics = await runEbayDiagnostics(query || undefined);
    return respond(diagnostics, 200);
  } catch (error: any) {
    return respond(
      {
        ok: false,
        error: error?.message || 'No se pudo ejecutar el diagnóstico de eBay',
        hint: 'Prueba /api/market/ebay-diagnostic?q=pokemon+yellow+game+boy',
      },
      500
    );
  }
}
