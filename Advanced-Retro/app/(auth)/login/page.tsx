'use client';

import { Suspense, useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

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
    if (err === 'confirm') toast.error('El enlace de confirmación ha expirado o no es válido. Inicia sesión y te podemos reenviar el correo.');
    if (err === 'missing_code') toast.error('Faltan datos en el enlace. Prueba de nuevo desde el correo.');
    if (err === 'config') toast.error('Configuración de auth incompleta.');
  }, [searchParams]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (!supabaseClient) {
        throw new Error('Configura Supabase en .env.local');
      }
      if (mode === 'register') {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined },
        });
        if (error) throw error;
        if (data?.user && !data.user.identities?.length) {
          toast.error('Ya existe una cuenta con este correo. Inicia sesión.');
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
        options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined },
      });
      if (error) throw error;
      toast.success('Te hemos enviado de nuevo el correo de confirmación. Revisa tu bandeja y spam.');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo reenviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const oauthLogin = async (provider: 'google' | 'apple') => {
    if (!supabaseClient) {
      toast.error('Configura Supabase en .env.local');
      return;
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) toast.error(error.message);
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
            <button className="button-secondary" onClick={() => oauthLogin('apple')}>
              Continuar con Apple
            </button>
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
