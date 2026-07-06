import { NextRequest } from 'next/server';
import { jsonRetrovilleAdminError, withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import {
  getRetrovilleAdminConfigurationData,
  saveRetrovilleAdminConfigurationData,
} from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminConfigurationData());
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    return withRetrovilleAdminRoute(async () =>
      saveRetrovilleAdminConfigurationData({
        maintenanceMode: Boolean(payload.maintenanceMode),
      })
    );
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
