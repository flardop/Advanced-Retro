'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RetrovilleAdminPasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (nextPassword !== confirmPassword) {
      setMessage('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/retroville/admin/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          nextPassword,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cambiar la contraseña');
      }
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setMessage('Contraseña actualizada correctamente.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm text-[var(--admin-text-muted)]">
        Contraseña actual
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          required
        />
      </label>
      <label className="block text-sm text-[var(--admin-text-muted)]">
        Nueva contraseña
        <input
          type="password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          required
        />
      </label>
      <label className="block text-sm text-[var(--admin-text-muted)]">
        Confirmar nueva contraseña
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          required
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
        {message ? <p className="text-sm text-[var(--admin-text-muted)]">{message}</p> : null}
      </div>
    </form>
  );
}

export function RetrovilleAdminMaintenanceToggle({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/retroville/admin/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceMode: checked,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo guardar la configuración');
      }
      setMessage(checked ? 'Modo mantenimiento activado.' : 'Modo mantenimiento desactivado.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 text-sm text-[var(--admin-text)]">
        <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
        Activar modo mantenimiento en toda la experiencia pública de Retroville
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
        {message ? <p className="text-sm text-[var(--admin-text-muted)]">{message}</p> : null}
      </div>
    </div>
  );
}
