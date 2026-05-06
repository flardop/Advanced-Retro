import { NextResponse } from 'next/server';
import { DEFAULT_SITE_THEME } from '@/lib/siteThemes';

export const dynamic = 'force-dynamic';

const FIXED_THEME_RESPONSE = {
  theme: DEFAULT_SITE_THEME,
  defaultTheme: DEFAULT_SITE_THEME,
  availableThemes: [DEFAULT_SITE_THEME],
  source: 'fixed-default',
};

export async function GET() {
  return NextResponse.json(FIXED_THEME_RESPONSE);
}

export async function PUT() {
  return NextResponse.json({
    ok: true,
    ...FIXED_THEME_RESPONSE,
    message: 'El estilo global está fijado en la versión principal de Advanced Retro.',
  });
}
