import { NextRequest, NextResponse } from 'next/server';
import {
  applyRetrovilleAdminCookie,
  getRequestIpAddress,
  getRequestUserAgent,
  jsonRetrovilleAdminError,
  signInRetrovilleAdmin,
} from '@/lib/retroville-admin/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await signInRetrovilleAdmin({
      email: String(payload.email || ''),
      password: String(payload.password || ''),
      ipAddress: getRequestIpAddress(request),
      userAgent: getRequestUserAgent(request),
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.display_name || null,
        },
      },
    });

    return applyRetrovilleAdminCookie(response, result.token);
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
