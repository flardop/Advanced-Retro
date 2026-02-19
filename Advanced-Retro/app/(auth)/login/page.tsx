'use client';

import { Suspense, useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function resolveAbsolutePathUrl(path: string): string | undefined {
  if (!path.startsWith('/')) return undefined;
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || '';
  const bases = [runtimeOrigin, configuredSiteUrl].filter(Boolean);
  for (const base of bases) {
    try {
      return new URL(path, base).toString();
    } catch {
      continue;
    }
  }
  return undefined;
}

function resolveAuthCallbackUrl(nextPath?: string | null): string | undefined {
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || '';
  const candidates = [runtimeOrigin, configuredSiteUrl].filter(Boolean);

  for (const base of candidates) {
    try {
      const url = new URL('/auth/callback', base);
      if (typeof nextPath === 'string' && nextPath.startsWith('/')) {
        url.searchParams.set('next', nextPath);
      }
      return url.toString();
    } catch {
      continue;
    }
  }

  return undefined;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (err === 'confirm') toast.error('El enlace de confirmación ha expirado o no es válido. Inicia sesión y te podemos reenviar el correo.');
    if (err === 'missing_code' || err === 'oauth_incomplete') {
      toast.error('Google no devolvió el código de acceso. Revisa Redirect URLs de Supabase y Google OAuth.');
    }
    if (err === 'config') toast.error('Configuración de auth incompleta.');
    if (err === 'oauth_cancelled') toast.error('Has cancelado el acceso social. Puedes intentarlo de nuevo.');
    if (err === 'oauth_failed') {
      const reason = searchParams.get('reason');
      toast.error(reason ? decodeURIComponent(reason) : 'No se pudo completar el acceso con proveedor social.');
      return;
    }
    if (err && !['confirm', 'missing_code', 'oauth_incomplete', 'config', 'oauth_cancelled', 'oauth_failed'].includes(err)) {
      const readable = errorDescription ? decodeURIComponent(errorDescription) : err;
      toast.error(`Error OAuth: ${readable}`);
    }
  }, [searchParams]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (!supabaseClient) {
        throw new Error('Configura Supabase en .env.local');
      }
      if (mode === 'register') {
        const callbackUrl = resolveAuthCallbackUrl('/perfil');
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        if (data?.user && !data.user.identities?.length) {
          toast.error('Ya existe una cuenta con este correo. Inicia sesión.');
          return;
        }
        if (data?.session) {
          toast.success('Cuenta creada. Ya estás dentro.');
          router.push('/perfil');
          return;
        }
        toast.success(
          'Te hemos enviado un correo de confirmación. Haz clic en el enlace del correo para activar tu cuenta. Revisa también la carpeta de spam.',
          { duration: 8000 }
        );
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('email') && (msg.includes('confirm') || msg.includes('verified'))) {
            toast.error('Tu cuenta aún no está confirmada. Revisa tu correo y haz clic en el enlace que te enviamos. Revisa también spam.');
            return;
          }
          throw error;
        }
        toast.success('Sesión iniciada');
        router.push('/perfil');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      toast.error('Escribe tu correo para reenviar el enlace.');
      return;
    }
    if (!supabaseClient) {
      toast.error('Configura Supabase en .env.local');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: resolveAuthCallbackUrl('/perfil') },
      });
      if (error) throw error;
      toast.success('Te hemos enviado de nuevo el correo de confirmación. Revisa tu bandeja y spam.');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo reenviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const oauthLogin = async (provider: 'google' | 'apple' | 'github') => {
    if (!supabaseClient) {
      toast.error('Configura Supabase en .env.local');
      return;
    }
    const nextPath = searchParams.get('next');
    const safeNextPath = typeof nextPath === 'string' && nextPath.startsWith('/') ? nextPath : '/perfil';
    const redirectTo = resolveAbsolutePathUrl(safeNextPath) || resolveAuthCallbackUrl(safeNextPath);
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('provider') && msg.includes('enabled')) {
        toast.error(
          provider === 'google'
            ? 'Google no está habilitado en Supabase (Authentication > Providers > Google).'
            : provider === 'apple'
              ? 'Apple no está habilitado en Supabase (Authentication > Providers > Apple).'
              : 'GitHub no está habilitado en Supabase (Authentication > Providers > GitHub).'
        );
        return;
      }
      toast.error(error.message);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="max-w-md mx-auto glass p-8">
          <h1 className="title-display text-3xl mb-2">Acceso ADVANCED RETRO</h1>
          <p className="text-textMuted mb-6">
            {mode === 'login' ? 'Bienvenido de nuevo.' : 'Crea tu cuenta premium.'}
          </p>

          {mode === 'register' && (
            <input
              className="w-full bg-transparent border border-line px-4 py-3 mb-3"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="w-full bg-transparent border border-line px-4 py-3 mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full bg-transparent border border-line px-4 py-3 mb-4"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="button-primary w-full"
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          {mode === 'login' && (
            <p className="text-sm text-textMuted mt-3">
              ¿No recibiste el correo de confirmación?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={resendConfirmation}
                disabled={loading || !email.trim()}
              >
                Reenviar
              </button>
            </p>
          )}

          <div className="flex items-center gap-3 my-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs text-textMuted">o</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2">
            <button className="button-secondary" onClick={() => oauthLogin('google')}>
              Continuar con Google
            </button>
            <button className="button-secondary" onClick={() => oauthLogin('github')}>
              Continuar con GitHub
            </button>
            <button className="button-secondary" onClick={() => oauthLogin('apple')}>
              Continuar con Apple
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <strong className="block mb-1">Configurar Google / Apple</strong>
            <p className="text-textMuted">
              Estos proveedores se activan en Supabase: <strong>Authentication → Providers</strong>.
              No necesitas variables OAuth de Google/Apple en este proyecto.
            </p>
          </div>

          <p className="text-sm text-textMuted mt-6">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              className="text-primary"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="section"><div className="container max-w-md mx-auto glass p-8"><p className="text-textMuted">Cargando...</p></div></section>}>
      <LoginForm />
    </Suspense>
  );
}
