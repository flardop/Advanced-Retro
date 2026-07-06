import bcrypt from 'bcryptjs';
import { addSeconds, subMinutes } from 'date-fns';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';
import {
  RETROVILLE_ADMIN_COOKIE_NAME,
  RETROVILLE_ADMIN_DASHBOARD_PATH,
  RETROVILLE_ADMIN_FAILED_ATTEMPTS_LIMIT,
  RETROVILLE_ADMIN_HOME_PATH,
  RETROVILLE_ADMIN_LOCKOUT_WINDOW_MINUTES,
  RETROVILLE_ADMIN_LOGIN_PATH,
  RETROVILLE_ADMIN_SESSION_MAX_AGE_SECONDS,
} from '@/lib/retroville-admin/constants';
import { generateSessionToken, hashIpAddress, sha256Hex } from '@/lib/retroville-admin/crypto';
import type {
  RetrovilleAdminAccessLogRow,
  RetrovilleAdminContext,
  RetrovilleAdminLoginAttemptRow,
  RetrovilleAdminSessionRow,
  RetrovilleAdminUserRow,
} from '@/types/retroville-admin';

export class RetrovilleAdminHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function getRetrovilleAdminCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/retroville/admin',
    maxAge: RETROVILLE_ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function getRequestIpAddress(request: Pick<NextRequest, 'headers'> | { headers: Headers }) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  return forwarded.split(',')[0].trim() || '0.0.0.0';
}

export function getRequestUserAgent(request: Pick<NextRequest, 'headers'> | { headers: Headers }) {
  return request.headers.get('user-agent')?.trim() || 'Unknown';
}

async function ensureSupabaseService() {
  if (!supabaseService) {
    throw new RetrovilleAdminHttpError(503, 'Supabase service role no configurado');
  }
  return supabaseService;
}

async function getAdminUserByEmail(email: string) {
  const service = await ensureSupabaseService();
  const { data, error } = await service
    .from('retroville_admin_users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (error) throw new RetrovilleAdminHttpError(500, error.message || 'No se pudo leer el usuario admin');
  return (data || null) as RetrovilleAdminUserRow | null;
}

async function getAdminUserById(id: string) {
  const service = await ensureSupabaseService();
  const { data, error } = await service
    .from('retroville_admin_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new RetrovilleAdminHttpError(500, error.message || 'No se pudo leer el usuario admin');
  return (data || null) as RetrovilleAdminUserRow | null;
}

async function getSessionByToken(token: string) {
  const service = await ensureSupabaseService();
  const tokenHash = sha256Hex(token);
  const { data, error } = await service
    .from('retroville_admin_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', nowIso())
    .maybeSingle();

  if (error) throw new RetrovilleAdminHttpError(500, error.message || 'No se pudo validar la sesión');
  return (data || null) as RetrovilleAdminSessionRow | null;
}

export async function recordRetrovilleAdminAccessLog(payload: {
  userId?: string | null;
  sessionId?: string | null;
  email?: string | null;
  ipHash?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  eventType: RetrovilleAdminAccessLogRow['event_type'];
  details?: Record<string, unknown>;
}) {
  const service = await ensureSupabaseService();
  await service.from('retroville_admin_access_logs').insert({
    user_id: payload.userId || null,
    session_id: payload.sessionId || null,
    email: payload.email || null,
    ip_hash: payload.ipHash || null,
    ip_address: payload.ipAddress || null,
    user_agent: payload.userAgent || null,
    event_type: payload.eventType,
    details: payload.details || {},
  });
}

export async function recordRetrovilleAdminLoginAttempt(payload: {
  email?: string | null;
  ipHash: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}) {
  const service = await ensureSupabaseService();
  await service.from('retroville_admin_login_attempts').insert({
    email: payload.email || null,
    ip_hash: payload.ipHash,
    ip_address: payload.ipAddress,
    user_agent: payload.userAgent,
    success: payload.success,
  });
}

export async function getRetrovilleAdminLockoutStatus(ipHash: string) {
  const service = await ensureSupabaseService();
  const since = subMinutes(new Date(), RETROVILLE_ADMIN_LOCKOUT_WINDOW_MINUTES).toISOString();
  const { data, error } = await service
    .from('retroville_admin_login_attempts')
    .select('attempted_at, success')
    .eq('ip_hash', ipHash)
    .eq('success', false)
    .gte('attempted_at', since)
    .order('attempted_at', { ascending: false })
    .limit(RETROVILLE_ADMIN_FAILED_ATTEMPTS_LIMIT);

  if (error) throw new RetrovilleAdminHttpError(500, error.message || 'No se pudo revisar el bloqueo');

  const attempts = (data || []) as Pick<RetrovilleAdminLoginAttemptRow, 'attempted_at' | 'success'>[];
  const locked = attempts.length >= RETROVILLE_ADMIN_FAILED_ATTEMPTS_LIMIT;
  const retryAt = locked
    ? addSeconds(new Date(attempts[attempts.length - 1].attempted_at), RETROVILLE_ADMIN_LOCKOUT_WINDOW_MINUTES * 60).toISOString()
    : null;

  return {
    locked,
    attempts: attempts.length,
    retryAt,
  };
}

export async function createRetrovilleAdminSession(payload: {
  userId: string;
  ipHash: string;
  ipAddress: string;
  userAgent: string;
}) {
  const service = await ensureSupabaseService();
  const token = generateSessionToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = addSeconds(new Date(), RETROVILLE_ADMIN_SESSION_MAX_AGE_SECONDS).toISOString();

  const { data, error } = await service
    .from('retroville_admin_sessions')
    .insert({
      user_id: payload.userId,
      token_hash: tokenHash,
      ip_hash: payload.ipHash,
      ip_address: payload.ipAddress,
      user_agent: payload.userAgent,
      expires_at: expiresAt,
      last_seen_at: nowIso(),
    })
    .select('*')
    .single();

  if (error) throw new RetrovilleAdminHttpError(500, error.message || 'No se pudo crear la sesión');

  return {
    token,
    session: data as RetrovilleAdminSessionRow,
  };
}

export async function revokeRetrovilleAdminSession(token: string | null | undefined) {
  if (!token) return;
  const service = await ensureSupabaseService();
  await service
    .from('retroville_admin_sessions')
    .update({ revoked_at: nowIso() })
    .eq('token_hash', sha256Hex(token))
    .is('revoked_at', null);
}

export async function touchRetrovilleAdminSession(sessionId: string) {
  const service = await ensureSupabaseService();
  await service.from('retroville_admin_sessions').update({ last_seen_at: nowIso() }).eq('id', sessionId);
}

export async function readRetrovilleAdminContextFromToken(token: string) {
  const session = await getSessionByToken(token);
  if (!session) return null;
  const user = await getAdminUserById(session.user_id);
  if (!user || !user.is_active) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name || null,
      lastLoginAt: user.last_login_at || null,
    },
    session: {
      id: session.id,
      expiresAt: session.expires_at,
      createdAt: session.created_at,
      lastSeenAt: session.last_seen_at,
      ipAddress: session.ip_address || null,
    },
  } satisfies RetrovilleAdminContext;
}

export async function getRetrovilleAdminContextFromCookies() {
  const token = cookies().get(RETROVILLE_ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return readRetrovilleAdminContextFromToken(token);
}

export async function requireRetrovilleAdminPageSession() {
  const context = await getRetrovilleAdminContextFromCookies();
  if (!context) {
    redirect(RETROVILLE_ADMIN_HOME_PATH);
  }
  await touchRetrovilleAdminSession(context.session.id).catch(() => null);
  return context;
}

export async function redirectIfRetrovilleAdminSessionExists() {
  const context = await getRetrovilleAdminContextFromCookies();
  if (context) {
    redirect(RETROVILLE_ADMIN_DASHBOARD_PATH);
  }
}

export async function signInRetrovilleAdmin(payload: {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const ipHash = hashIpAddress(payload.ipAddress);

  const lockout = await getRetrovilleAdminLockoutStatus(ipHash);
  if (lockout.locked) {
    throw new RetrovilleAdminHttpError(
      429,
      `Acceso bloqueado temporalmente. Vuelve a intentarlo después de ${lockout.retryAt || 'unos minutos'}.`
    );
  }

  const user = await getAdminUserByEmail(email);
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !user.is_active || !passwordMatches) {
    await recordRetrovilleAdminLoginAttempt({
      email,
      ipHash,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      success: false,
    });
    throw new RetrovilleAdminHttpError(401, 'Credenciales inválidas');
  }

  await recordRetrovilleAdminLoginAttempt({
    email,
    ipHash,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    success: true,
  });

  const { token, session } = await createRetrovilleAdminSession({
    userId: user.id,
    ipHash,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
  });

  const service = await ensureSupabaseService();
  await service
    .from('retroville_admin_users')
    .update({ last_login_at: nowIso(), updated_at: nowIso() })
    .eq('id', user.id);

  await recordRetrovilleAdminAccessLog({
    userId: user.id,
    sessionId: session.id,
    email: user.email,
    ipHash,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    eventType: 'login',
  });

  return {
    token,
    user,
    session,
  };
}

export async function changeRetrovilleAdminPassword(payload: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  email: string;
}) {
  const user = await getAdminUserById(payload.userId);
  if (!user) {
    throw new RetrovilleAdminHttpError(404, 'Usuario admin no encontrado');
  }

  const matches = await bcrypt.compare(payload.currentPassword, user.password_hash);
  if (!matches) {
    throw new RetrovilleAdminHttpError(400, 'La contraseña actual no es correcta');
  }

  const nextPassword = String(payload.nextPassword || '');
  if (nextPassword.length < 8) {
    throw new RetrovilleAdminHttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
  }

  const nextHash = await bcrypt.hash(nextPassword, 12);
  const service = await ensureSupabaseService();
  await service
    .from('retroville_admin_users')
    .update({ password_hash: nextHash, updated_at: nowIso() })
    .eq('id', user.id);

  await service
    .from('retroville_admin_sessions')
    .update({ revoked_at: nowIso() })
    .eq('user_id', user.id)
    .neq('id', payload.sessionId)
    .is('revoked_at', null);

  await recordRetrovilleAdminAccessLog({
    userId: user.id,
    sessionId: payload.sessionId,
    email: payload.email,
    ipHash: payload.ipAddress ? hashIpAddress(payload.ipAddress) : null,
    ipAddress: payload.ipAddress || null,
    userAgent: payload.userAgent || null,
    eventType: 'password_change',
  });
}

export async function getRetrovilleAdminRouteContext() {
  const token = cookies().get(RETROVILLE_ADMIN_COOKIE_NAME)?.value;
  if (!token) throw new RetrovilleAdminHttpError(401, 'Unauthorized');
  const context = await readRetrovilleAdminContextFromToken(token);
  if (!context) throw new RetrovilleAdminHttpError(401, 'Unauthorized');
  await touchRetrovilleAdminSession(context.session.id).catch(() => null);
  return context;
}

export function jsonRetrovilleAdminError(error: unknown) {
  if (error instanceof RetrovilleAdminHttpError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function withRetrovilleAdminRoute<T>(handler: (context: RetrovilleAdminContext) => Promise<T>) {
  try {
    const context = await getRetrovilleAdminRouteContext();
    const data = await handler(context);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return jsonRetrovilleAdminError(error);
  }
}

export function applyRetrovilleAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(RETROVILLE_ADMIN_COOKIE_NAME, token, getRetrovilleAdminCookieOptions());
  return response;
}

export function clearRetrovilleAdminCookie(response: NextResponse) {
  response.cookies.set(RETROVILLE_ADMIN_COOKIE_NAME, '', {
    ...getRetrovilleAdminCookieOptions(),
    maxAge: 0,
  });
  return response;
}
