'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RetrovilleAdminErrorStatusSelect({
  occurrenceKey,
  status,
}: {
  occurrenceKey: string;
  status: 'new' | 'reviewed' | 'resolved' | string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const handleChange = async (nextValue: string) => {
    setValue(nextValue);
    setSaving(true);
    try {
      await fetch('/api/retroville/admin/errors/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          occurrenceKey,
          status: nextValue,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(event) => void handleChange(event.target.value)}
      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none disabled:opacity-60"
    >
      <option value="new">Nuevo</option>
      <option value="reviewed">Revisado</option>
      <option value="resolved">Resuelto</option>
    </select>
  );
}

export function RetrovilleAdminClearResolvedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/retroville/admin/errors/clear-resolved', {
        method: 'POST',
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: { deleted: number };
        error?: string;
      } | null;

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error || 'No se pudieron limpiar los errores resueltos');
      }

      setMessage(`Se eliminaron ${payload.data.deleted} errores resueltos con más de 7 días.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron limpiar los errores resueltos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="rounded-2xl border border-[rgba(224,93,79,0.35)] bg-[rgba(224,93,79,0.14)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] disabled:opacity-60"
      >
        {loading ? 'Limpiando…' : 'Limpiar errores resueltos'}
      </button>
      {message ? <p className="text-sm text-[var(--admin-text-muted)]">{message}</p> : null}
    </div>
  );
}
