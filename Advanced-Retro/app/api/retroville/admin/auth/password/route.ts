import { NextRequest } from 'next/server';
import {
  changeRetrovilleAdminPassword,
  getRequestIpAddress,
  getRequestUserAgent,
  getRetrovilleAdminRouteContext,
  jsonRetrovilleAdminError,
} from '@/lib/retroville-admin/auth';

export async function POST(request: NextRequest) {
  try {
    const context = await getRetrovilleAdminRouteContext();
    const payload = (await request.json()) as Record<string, unknown>;

    await changeRetrovilleAdminPassword({
      userId: context.user.id,
      currentPassword: String(payload.currentPassword || ''),
      nextPassword: String(payload.nextPassword || ''),
      sessionId: context.session.id,
      ipAddress: getRequestIpAddress(request),
      userAgent: getRequestUserAgent(request),
      email: context.user.email,
    });

    return Response.json({ success: true });
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
