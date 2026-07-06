import { NextRequest, NextResponse } from 'next/server';
import {
  clearRetrovilleAdminCookie,
  getRequestIpAddress,
  getRequestUserAgent,
  getRetrovilleAdminRouteContext,
  recordRetrovilleAdminAccessLog,
  revokeRetrovilleAdminSession,
} from '@/lib/retroville-admin/auth';
import { RETROVILLE_ADMIN_COOKIE_NAME } from '@/lib/retroville-admin/constants';
import { hashIpAddress } from '@/lib/retroville-admin/crypto';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(RETROVILLE_ADMIN_COOKIE_NAME)?.value;
  const context = await getRetrovilleAdminRouteContext().catch(() => null);

  if (token) {
    await revokeRetrovilleAdminSession(token).catch(() => null);
  }

  if (context) {
    const ipAddress = getRequestIpAddress(request);
    await recordRetrovilleAdminAccessLog({
      userId: context.user.id,
      sessionId: context.session.id,
      email: context.user.email,
      ipHash: hashIpAddress(ipAddress),
      ipAddress,
      userAgent: getRequestUserAgent(request),
      eventType: 'logout',
    }).catch(() => null);
  }

  const response = NextResponse.json({ success: true });
  return clearRetrovilleAdminCookie(response);
}
