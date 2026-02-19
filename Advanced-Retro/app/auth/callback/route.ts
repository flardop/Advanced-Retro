import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { EmailOtpType } from '@supabase/supabase-js';

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email',
  'email_change',
]);

async function syncUserProfile(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && supabaseAdmin) {
    await supabaseAdmin.from('users').upsert(
      {
        id: user.id,
        email: user.email || `${user.id}@local.invalid`,
        role: 'user',
      },
      { onConflict: 'id' }
    );

    await supabaseAdmin
      .from('users')
      .update({
        name:
          typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name.slice(0, 80)
            : null,
        avatar_url:
          typeof user.user_metadata?.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : typeof user.user_metadata?.picture === 'string'
              ? user.user_metadata.picture
              : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpTypeRaw = searchParams.get('type');
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  const origin = requestUrl.origin;
  const redirectTo = (searchParams.get('next') || '/perfil').startsWith('/')
    ? searchParams.get('next')!
    : '/perfil';

  if (oauthError) {
    if (oauthError === 'access_denied') {
      return NextResponse.redirect(`${origin}/login?error=oauth_cancelled`);
    }

    const reason = oauthErrorDescription || oauthError;
    return NextResponse.redirect(
      `${origin}/login?error=oauth_failed&reason=${encodeURIComponent(reason)}`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    if (typeof code === 'string' && code.trim()) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      await syncUserProfile(supabase);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    const otpType = String(otpTypeRaw || '').trim() as EmailOtpType;
    if (typeof tokenHash === 'string' && tokenHash.trim() && ALLOWED_OTP_TYPES.has(otpType)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });
      if (error) throw error;
      await syncUserProfile(supabase);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    return NextResponse.redirect(`${origin}/login?error=oauth_incomplete`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=confirm`);
  }
}
