import { NextRequest, NextResponse } from 'next/server';
import {
  getRetrovilleAdminRouteContext,
  jsonRetrovilleAdminError,
} from '@/lib/retroville-admin/auth';
import { convertRowsToCsv } from '@/lib/admin/csv';
import { getRetrovilleAdminRealtimeData } from '@/lib/retroville-admin/data';

export async function GET(_request: NextRequest) {
  try {
    await getRetrovilleAdminRouteContext();
    const data = await getRetrovilleAdminRealtimeData();
    const exportedAt = new Date().toISOString();
    const geoMap = new Map(data.geoBuckets.map((item) => [`${item.country}|${item.label}`, item]));

    const csv = convertRowsToCsv([
      ...data.countryBuckets.map((item) => ({
        tipo_fila: 'pais_activo',
        fecha_exportacion: exportedAt,
        pais: item.label,
        sesiones: item.value,
        cuota_pct: Number(item.share.toFixed(2)),
      })),
      ...data.spainBuckets.map((item) => ({
        tipo_fila: 'zona_espana',
        fecha_exportacion: exportedAt,
        pais: item.country,
        zona: item.label,
        region: item.region,
        pagina_dominante: item.primaryPage,
        sesiones: item.sessions,
        cuota_pct: Number(item.share.toFixed(2)),
      })),
      ...data.sessions.map((session) => {
        const bucket = geoMap.get(`${session.country}|${session.locationLabel}`);
        return {
          tipo_fila: 'sesion_activa',
          fecha_exportacion: exportedAt,
          sesion_id: session.id,
          pagina_actual: session.currentPage,
          pais: session.country,
          zona: session.locationLabel,
          ciudad: session.city,
          region: session.region,
          dispositivo: session.deviceType,
          tiempo_segundos: session.durationSeconds,
          ultimo_latido: session.lastHeartbeat,
          sesiones_en_esa_zona: bucket?.sessions || 1,
          pagina_dominante_zona: bucket?.primaryPage || session.currentPage,
          foco_espana: session.country.toLowerCase().includes('espa') || session.country.toLowerCase() === 'spain' ? 'si' : 'no',
        };
      }),
    ]);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="retroville-live-${exportedAt.slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
