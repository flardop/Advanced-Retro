import { NextRequest } from 'next/server';
import { jsonRetrovilleAdminError, withRetrovilleAdminRoute } from '@/lib/retroville-admin/auth';
import { RETROVILLE_PUBLIC_SETTING_KEYS } from '@/lib/retroville-admin/constants';
import {
  getRetrovilleAdminContentData,
  saveRetrovilleAdminContentData,
} from '@/lib/retroville-admin/data';

export async function GET() {
  return withRetrovilleAdminRoute(async () => getRetrovilleAdminContentData());
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    return withRetrovilleAdminRoute(async () =>
      saveRetrovilleAdminContentData({
        [RETROVILLE_PUBLIC_SETTING_KEYS.heroTagline]: String(payload.heroTagline || ''),
        [RETROVILLE_PUBLIC_SETTING_KEYS.buyerBriefCopy]: String(payload.buyerBriefCopy || ''),
        [RETROVILLE_PUBLIC_SETTING_KEYS.contactEmail]: String(payload.contactEmail || ''),
        [RETROVILLE_PUBLIC_SETTING_KEYS.launchDate]: String(payload.launchDate || ''),
        [RETROVILLE_PUBLIC_SETTING_KEYS.eventDescription]: String(payload.eventDescription || ''),
        [RETROVILLE_PUBLIC_SETTING_KEYS.waitlistOpen]: Boolean(payload.waitlistOpen),
      })
    );
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}
