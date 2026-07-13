import { NextRequest, NextResponse } from 'next/server';
import {
  getRetrovilleAdminRouteContext,
  jsonRetrovilleAdminError,
} from '@/lib/retroville-admin/auth';
import { convertRowsToCsv } from '@/lib/admin/csv';
import { getRetrovilleAdminUsersData } from '@/lib/retroville-admin/data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    await getRetrovilleAdminRouteContext();
    const result = await getRetrovilleAdminUsersData({
      page: 1,
      pageSize: 5000,
      search: searchParams.get('search') || '',
      profile: searchParams.get('profile') || '',
      intent: searchParams.get('intent') || '',
      status: searchParams.get('status') || '',
      sort: searchParams.get('sort') || 'created_at',
      direction: searchParams.get('direction') === 'asc' ? 'asc' : 'desc',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
    });

    const csv = convertRowsToCsv(
      result.rows.map((row) => ({
        nombre: row.first_name || '',
        apellidos: row.last_name || '',
        nombre_completo: row.display_name || '',
        email: row.email,
        telefono: row.phone || '',
        canal: row.signup_intent || 'newsletter',
        perfil: row.role_label || '',
        documento_interes: row.document_interest || '',
        pregunta: row.question || '',
        fecha_registro: row.created_at,
        pagina: row.page_path || '',
        dispositivo: row.device_type || '',
        pais: row.country || '',
        estado: row.status || 'active',
        visitas: row.visits_count || 0,
      }))
    );

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="retroville-suscriptores.csv"',
      },
    });
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
