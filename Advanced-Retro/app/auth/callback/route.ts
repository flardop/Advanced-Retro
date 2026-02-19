import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { EmailOtpType } from '@supabase/supabase-js';
import { syncAuthUserProfileRow } from '@/lib/serverAuth';

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
    await syncAuthUserProfileRow(user);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
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

    if (
      typeof accessToken === 'string' &&
      accessToken.trim() &&
      typeof refreshToken === 'string' &&
      refreshToken.trim()
    ) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) {
        await syncUserProfile(supabase);
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
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

    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser();
    if (existingUser) {
      await syncUserProfile(supabase);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    if ([...searchParams.keys()].length === 0) {
      return NextResponse.redirect(`${origin}/login?error=oauth_incomplete&reason=missing_exchange_params`);
    }

    const queryKeys = [...searchParams.keys()].slice(0, 12).join(',');
    const reason = queryKeys ? `missing exchange params (${queryKeys})` : 'missing exchange params';
    return NextResponse.redirect(
      `${origin}/login?error=oauth_incomplete&reason=${encodeURIComponent(reason)}`
    );
  } catch (error: any) {
    const message = String(error?.message || '').trim();
    const lower = message.toLowerCase();

    if (lower.includes('expired') || lower.includes('otp') || lower.includes('token')) {
      return NextResponse.redirect(`${origin}/login?error=confirm`);
    }

    if (message) {
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&reason=${encodeURIComponent(message.slice(0, 240))}`
      );
    }

    return NextResponse.redirect(`${origin}/login?error=confirm`);
  }
}
