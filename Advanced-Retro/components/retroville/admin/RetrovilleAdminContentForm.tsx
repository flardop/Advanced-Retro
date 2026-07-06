'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ContentData = {
  heroTagline: string;
  buyerBriefCopy: string;
  contactEmail: string;
  launchDate: string;
  eventDescription: string;
  waitlistOpen: boolean;
  maintenanceMode: boolean;
};

function normalizeDateValue(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

export default function RetrovilleAdminContentForm({
  initialData,
}: {
  initialData: ContentData;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    heroTagline: initialData.heroTagline,
    buyerBriefCopy: initialData.buyerBriefCopy,
    contactEmail: initialData.contactEmail,
    launchDate: normalizeDateValue(initialData.launchDate),
    eventDescription: initialData.eventDescription,
    waitlistOpen: initialData.waitlistOpen,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/retroville/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          launchDate: form.launchDate ? new Date(form.launchDate).toISOString() : '',
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo guardar el contenido');
      }
      setMessage('Contenido guardado correctamente. La web pública ya puede leer estos valores sin deploy.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el contenido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Hero</p>
          <label className="mt-4 block text-sm text-[var(--admin-text-muted)]">
            Frase principal
            <textarea
              value={form.heroTagline}
              onChange={(event) => setForm((prev) => ({ ...prev, heroTagline: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
            />
          </label>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Contacto</p>
          <label className="mt-4 block text-sm text-[var(--admin-text-muted)]">
            Email visible
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
            />
          </label>
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 text-sm text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.waitlistOpen}
              onChange={(event) => setForm((prev) => ({ ...prev, waitlistOpen: event.target.checked }))}
            />
            Waitlist activa para nuevos registros
          </label>
        </section>
      </div>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Buyer brief</p>
        <label className="mt-4 block text-sm text-[var(--admin-text-muted)]">
          Copy editable
          <textarea
            value={form.buyerBriefCopy}
            onChange={(event) => setForm((prev) => ({ ...prev, buyerBriefCopy: event.target.value }))}
            rows={5}
            className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          />
        </label>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Reveal del 10 de noviembre</p>
          <label className="mt-4 block text-sm text-[var(--admin-text-muted)]">
            Fecha de lanzamiento
            <input
              type="datetime-local"
              value={form.launchDate}
              onChange={(event) => setForm((prev) => ({ ...prev, launchDate: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
            />
          </label>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Descripción del evento</p>
          <textarea
            value={form.eventDescription}
            onChange={(event) => setForm((prev) => ({ ...prev, eventDescription: event.target.value }))}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          />
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar contenido'}
        </button>
        {message ? <p className="text-sm text-[var(--admin-text-muted)]">{message}</p> : null}
      </div>
    </form>
  );
}
