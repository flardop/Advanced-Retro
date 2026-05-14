'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { getStoreProductLimit, isWhiteLabelStorefront, type MembershipTier } from '@/lib/membership';
import type { StorefrontRecord } from '@/lib/storefronts';

export default function StoreDashboardManager({
  initialStore,
  membershipTier,
}: {
  initialStore: StorefrontRecord;
  membershipTier: MembershipTier;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialStore.name,
    shortDescription: initialStore.shortDescription,
    longDescription: initialStore.longDescription,
    primaryColor: initialStore.primaryColor,
    category: initialStore.category,
    theme: initialStore.theme,
    contactEmail: initialStore.contactEmail || '',
    instagram: initialStore.instagram || '',
    twitter: initialStore.twitter || '',
    slug: initialStore.slug,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const productLimitValue = getStoreProductLimit(membershipTier);
  const productLimit = productLimitValue === null ? 'Sin límite' : `${productLimitValue} productos`;
  const whiteLabel = isWhiteLabelStorefront(membershipTier);

  const stats = useMemo(
    () => [
      { label: 'Visitas', value: initialStore.views.toLocaleString('es-ES') },
      { label: 'Productos activos', value: String(initialStore.products.length) },
      { label: 'Creada', value: new Date(initialStore.createdAt).toLocaleDateString('es-ES') },
      { label: 'Límite actual', value: productLimit },
    ],
    [initialStore.createdAt, initialStore.products.length, initialStore.views, productLimit]
  );

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  async function saveChanges() {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/tiendas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          shortDescription: form.shortDescription,
          longDescription: form.longDescription,
          primaryColor: form.primaryColor,
          category: form.category,
          theme: form.theme,
          contactEmail: form.contactEmail,
          instagram: form.instagram,
          twitter: form.twitter,
          slug: form.slug,
          membershipTier,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudieron guardar los cambios.');
      }

      const draft = window.localStorage.getItem('advanced-retro-store-preview-draft');
      const parsed = draft ? JSON.parse(draft) : {};
      window.localStorage.setItem(
        'advanced-retro-store-preview-draft',
        JSON.stringify({
          ...parsed,
          ...form,
          membershipTier,
          createdAt: parsed?.createdAt || new Date().toISOString(),
        })
      );

      setFeedback('Cambios guardados. Ya puedes revisar la tienda pública con el nuevo aspecto.');
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,30,0.96),rgba(8,12,20,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{stat.label}</p>
            <p className="mt-3 text-2xl font-black text-white">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.64fr)_minmax(320px,0.36fr)]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,30,0.96),rgba(8,12,20,0.98))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Editor de información</p>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Gestiona tu tienda</h1>
            </div>
            <Link href={`/tiendas/${form.slug}`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]">
              Ver tienda pública
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Nombre</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Slug</span>
              <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
              <span>Descripción corta</span>
              <textarea value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
              <span>Historia / Sobre esta tienda</span>
              <textarea value={form.longDescription} onChange={(event) => updateField('longDescription', event.target.value)} rows={6} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Categoría</span>
              <input value={form.category} onChange={(event) => updateField('category', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Color principal</span>
              <div className="flex gap-3">
                <input value={form.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
                <input type="color" value={form.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value)} className="h-12 w-16 rounded-2xl border border-white/10 bg-transparent" />
              </div>
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Email de contacto</span>
              <input value={form.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Instagram</span>
              <input value={form.instagram} onChange={(event) => updateField('instagram', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Twitter / X</span>
              <input value={form.twitter} onChange={(event) => updateField('twitter', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-primary/50" />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.22)] transition hover:brightness-110 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
            <Link href="/crear-tienda" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]">
              Volver al wizard
            </Link>
          </div>

          {feedback ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{feedback}</p> : null}
        </div>

        <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,30,0.96),rgba(8,12,20,0.98))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Gestión de productos</p>
          <h2 className="mt-3 text-2xl font-black text-white">Límites y estado</h2>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Estado</p>
              <p className="mt-2 font-semibold text-white">{initialStore.state === 'active' ? 'Activa' : initialStore.state === 'paused' ? 'Pausada' : 'En revisión'}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Productos activos</p>
              <p className="mt-2 font-semibold text-white">{initialStore.products.length} / {productLimit}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Acción recomendada</p>
              <p className="mt-2 leading-7">
                {whiteLabel
                  ? 'Refina el tono visual y la historia de tu tienda para que se sienta completamente propia antes de llenarla de producto.'
                  : 'Sube tu historia, ajusta el color principal y añade tus primeras piezas para activar la sensación de tienda real.'}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
