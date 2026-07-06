'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RETROVILLE_ADMIN_HOME_PATH } from '@/lib/retroville-admin/constants';

export default function RetrovilleAdminLoginForm({
  redirectedFrom,
}: {
  redirectedFrom?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/retroville/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.error || 'No se pudo iniciar sesión');
        return;
      }

      router.replace(redirectedFrom || RETROVILLE_ADMIN_HOME_PATH);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm text-[var(--admin-text-muted)]">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          placeholder="tu-email@dominio.com"
          required
        />
      </label>

      <label className="block text-sm text-[var(--admin-text-muted)]">
        Contraseña
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          placeholder="••••••••"
          required
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-[rgba(224,93,79,0.35)] bg-[rgba(224,93,79,0.14)] px-4 py-3 text-sm text-[var(--admin-text)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--admin-primary-hover)] disabled:opacity-60"
      >
        {submitting ? 'Accediendo…' : 'Entrar al panel'}
      </button>
    </form>
  );
}
