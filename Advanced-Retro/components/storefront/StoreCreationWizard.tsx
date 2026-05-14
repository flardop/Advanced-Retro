'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import type { MembershipTier } from '@/lib/membership';

type WizardAnswers = {
  name: string;
  shortDescription: string;
  category: string;
  theme: string;
  primaryColor: string;
  logoDataUrl: string;
  slug: string;
  instagram: string;
  twitter: string;
  contactEmail: string;
  longDescription: string;
};

type Props = {
  membershipTier: MembershipTier;
};

const categoryOptions = [
  'Videojuegos retro',
  'Consolas y hardware',
  'Accesorios gaming',
  'Coleccionables',
  'Merchandising',
  'Ropa y textil',
  'Arte y prints',
  'Libros y fanzines',
  'Otro',
];

const themeOptions = [
  { key: 'retro-dark', label: 'Retro oscuro (como AdvancedRetro)' },
  { key: 'minimal', label: 'Limpio y minimalista' },
  { key: 'colorful', label: 'Colorido y enérgico' },
  { key: 'vintage', label: 'Vintage analógico' },
  { key: 'futuristic', label: 'Futurista/tech' },
  { key: 'pastel', label: 'Pastel y suave' },
];

const initialAnswers: WizardAnswers = {
  name: '',
  shortDescription: '',
  category: categoryOptions[0],
  theme: 'retro-dark',
  primaryColor: '#66c0f4',
  logoDataUrl: '',
  slug: '',
  instagram: '',
  twitter: '',
  contactEmail: '',
  longDescription: '',
};

const steps = [
  {
    id: 'name',
    title: 'PASO 1 — IDENTIDAD',
    prompt: '¡Hola! Vamos a crear tu tienda. ¿Cuál será el nombre de tu tienda?',
  },
  {
    id: 'shortDescription',
    title: 'PASO 2 — DESCRIPCIÓN',
    prompt: 'Genial. ¿En dos o tres frases, de qué va tu tienda? ¿Qué vendes?',
  },
  {
    id: 'category',
    title: 'PASO 3 — CATEGORÍA',
    prompt: '¿Qué tipo de productos vendes principalmente?',
  },
  {
    id: 'theme',
    title: 'PASO 4 — ESTILO VISUAL',
    prompt: '¿Cómo quieres que se vea tu tienda? Elige el ambiente:',
  },
  {
    id: 'primaryColor',
    title: 'PASO 5 — COLOR PRINCIPAL',
    prompt: '¿Tienes un color preferido para tu tienda? Puedes escribir un nombre de color o código hex.',
  },
  {
    id: 'logoDataUrl',
    title: 'PASO 6 — LOGO / IMAGEN',
    prompt: '¿Tienes un logo o imagen para tu tienda? Puedes subir uno ahora o saltar este paso.',
  },
  {
    id: 'slug',
    title: 'PASO 7 — SLUG (URL)',
    prompt: '¿Con qué URL quieres que aparezca tu tienda? Será: advancedretro.es/tiendas/[TU-SLUG]',
  },
  {
    id: 'contact',
    title: 'PASO 8 — CONTACTO/REDES',
    prompt: '¿Quieres añadir alguna red social o forma de contacto a tu tienda?',
  },
  {
    id: 'longDescription',
    title: 'PASO 9 — DESCRIPCIÓN LARGA',
    prompt: 'Cuéntanos más sobre tu historia o por qué abriste esta tienda. Esto aparecerá en el “Sobre mí” de tu tienda.',
  },
  {
    id: 'confirm',
    title: 'PASO 10 — CONFIRMACIÓN',
    prompt: '¿Todo correcto? ¡Vamos a crear tu tienda!',
  },
] as const;

function slugifyStoreName(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 36);
}

export default function StoreCreationWizard({ membershipTier }: Props) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [typing, setTyping] = useState(true);
  const [slugState, setSlugState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    setTyping(true);
    const timer = window.setTimeout(() => setTyping(false), 320);
    return () => window.clearTimeout(timer);
  }, [stepIndex]);

  useEffect(() => {
    if (!answers.name.trim()) return;
    if (answers.slug.trim()) return;
    setAnswers((current) => ({
      ...current,
      slug: slugifyStoreName(current.name),
    }));
  }, [answers.name, answers.slug]);

  useEffect(() => {
    if (currentStep.id !== 'slug') return;
    const slug = slugifyStoreName(answers.slug || answers.name);
    if (!slug) {
      setSlugState('idle');
      return;
    }

    const timer = window.setTimeout(async () => {
      setSlugState('checking');
      try {
        const response = await fetch(`/api/tiendas/slug-check?slug=${encodeURIComponent(slug)}`);
        const payload = await response.json();
        setSlugState(payload.available ? 'available' : 'taken');
      } catch {
        setSlugState('idle');
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [answers.slug, answers.name, currentStep.id]);

  const storePreview = useMemo(() => ({
    name: answers.name || 'Tu tienda',
    shortDescription:
      answers.shortDescription || 'Tu narrativa comercial, estética y catálogo vivirán aquí.',
    slug: slugifyStoreName(answers.slug || answers.name || 'mi-tienda'),
    themeLabel: themeOptions.find((option) => option.key === answers.theme)?.label || 'Retro oscuro',
    category: answers.category,
    primaryColor: answers.primaryColor,
  }), [answers]);

  function update<K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function goNext() {
    if (currentStep.id === 'name' && !answers.name.trim()) {
      setError('Necesito el nombre de la tienda para seguir.');
      return;
    }
    if (currentStep.id === 'shortDescription' && !answers.shortDescription.trim()) {
      setError('Necesito una descripción breve para construir la dirección creativa.');
      return;
    }
    if (currentStep.id === 'slug' && slugState === 'taken') {
      setError('Ese slug ya está ocupado. Elige otro para continuar.');
      return;
    }
    if (currentStep.id === 'slug' && !slugifyStoreName(answers.slug || answers.name)) {
      setError('El slug todavía no es válido.');
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
    setError(null);
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update('logoDataUrl', typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  }

  async function createStore() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: answers.name,
        shortDescription: answers.shortDescription,
        category: answers.category,
        theme: answers.theme,
        primaryColor: answers.primaryColor,
        slug: slugifyStoreName(answers.slug || answers.name),
        instagram: answers.instagram,
        twitter: answers.twitter,
        contactEmail: answers.contactEmail,
        longDescription: answers.longDescription,
        membershipTier,
      };

      const response = await fetch('/api/tiendas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'No se pudo crear la tienda.');
      }

      const previewDraft = {
        ...payload,
        logoDataUrl: answers.logoDataUrl,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem('advanced-retro-store-preview-draft', JSON.stringify(previewDraft));
      router.push('/dashboard/mi-tienda?created=1');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear la tienda.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.42fr)]">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.94),rgba(8,12,20,0.98))] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.22)] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Wizard conversacional</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Crea tu tienda paso a paso</h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>

        <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/14 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{currentStep.title}</p>
              {typing ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  El asistente está preparando la siguiente pregunta...
                </div>
              ) : (
                <p className="mt-3 text-base leading-8 text-slate-100">{currentStep.prompt}</p>
              )}
            </div>
          </div>

          {!typing ? (
            <div className="mt-6 space-y-4">
              {currentStep.id === 'name' ? (
                <input
                  value={answers.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Ej. Neon Cart Club"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50"
                />
              ) : null}

              {currentStep.id === 'shortDescription' ? (
                <textarea
                  value={answers.shortDescription}
                  onChange={(event) => update('shortDescription', event.target.value)}
                  rows={5}
                  placeholder="Describe qué vendes, a quién va dirigido y qué hace distinta a tu tienda."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50"
                />
              ) : null}

              {currentStep.id === 'category' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoryOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => update('category', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${answers.category === option ? 'border-primary/50 bg-primary/10 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              {currentStep.id === 'theme' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {themeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => update('theme', option.key)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${answers.theme === option.key ? 'border-primary/50 bg-primary/10 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {currentStep.id === 'primaryColor' ? (
                <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="h-20 rounded-2xl border border-white/10" style={{ backgroundColor: answers.primaryColor }} />
                  </div>
                  <div className="space-y-3">
                    <input
                      value={answers.primaryColor}
                      onChange={(event) => update('primaryColor', event.target.value)}
                      placeholder="#66c0f4"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50"
                    />
                    <input type="color" value={answers.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-transparent" />
                  </div>
                </div>
              ) : null}

              {currentStep.id === 'logoDataUrl' ? (
                <div className="space-y-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-white/14 bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-300 transition hover:border-primary/40 hover:bg-primary/5">
                    <span className="font-semibold text-white">Sube un logo o imagen</span>
                    <span className="mt-2 text-xs text-white/46">PNG, JPG o WebP. Puedes saltarlo si prefieres.</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  {answers.logoDataUrl ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                      <div className="relative h-32 w-full overflow-hidden rounded-xl">
                        <Image
                          src={answers.logoDataUrl}
                          alt="Preview del logo"
                          fill
                          unoptimized
                          sizes="240px"
                          className="object-contain object-left"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentStep.id === 'slug' ? (
                <div className="space-y-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    advancedretro.es/tiendas/
                    <span className="font-semibold text-white">{slugifyStoreName(answers.slug || answers.name) || 'tu-slug'}</span>
                  </div>
                  <input
                    value={answers.slug}
                    onChange={(event) => update('slug', event.target.value)}
                    placeholder="mi-tienda-retro"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50"
                  />
                  <p className={`text-xs uppercase tracking-[0.2em] ${slugState === 'available' ? 'text-emerald-300' : slugState === 'taken' ? 'text-rose-300' : 'text-white/42'}`}>
                    {slugState === 'checking'
                      ? 'Comprobando disponibilidad...'
                      : slugState === 'available'
                        ? 'Slug disponible'
                        : slugState === 'taken'
                          ? 'Slug ocupado'
                          : 'Escribe una URL corta y clara'}
                  </p>
                </div>
              ) : null}

              {currentStep.id === 'contact' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={answers.instagram} onChange={(event) => update('instagram', event.target.value)} placeholder="Instagram" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50" />
                  <input value={answers.twitter} onChange={(event) => update('twitter', event.target.value)} placeholder="Twitter / X" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50" />
                  <input value={answers.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} placeholder="Email de contacto" className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50" />
                </div>
              ) : null}

              {currentStep.id === 'longDescription' ? (
                <textarea
                  value={answers.longDescription}
                  onChange={(event) => update('longDescription', event.target.value)}
                  rows={6}
                  placeholder="Comparte tu historia, tu criterio de selección y por qué existe esta tienda."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50"
                />
              ) : null}

              {currentStep.id === 'confirm' ? (
                <div className="rounded-[1.6rem] border border-primary/20 bg-primary/8 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-primary">Preview generado</p>
                      <h2 className="mt-2 text-2xl font-black text-white">{storePreview.name}</h2>
                      <p className="mt-2 text-sm text-slate-300">{storePreview.shortDescription}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      {membershipTier === 'vip' ? 'VIP RETRO' : 'COLECCIONISTA'}
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <dt className="text-[11px] uppercase tracking-[0.22em] text-white/42">URL</dt>
                      <dd className="mt-2 text-sm font-semibold text-white">advancedretro.es/tiendas/{storePreview.slug}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <dt className="text-[11px] uppercase tracking-[0.22em] text-white/42">Estética</dt>
                      <dd className="mt-2 text-sm font-semibold text-white">{storePreview.themeLabel}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <dt className="text-[11px] uppercase tracking-[0.22em] text-white/42">Categoría</dt>
                      <dd className="mt-2 text-sm font-semibold text-white">{storePreview.category}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <dt className="text-[11px] uppercase tracking-[0.22em] text-white/42">Color principal</dt>
                      <dd className="mt-2 flex items-center gap-3 text-sm font-semibold text-white">
                        <span className="inline-flex h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: storePreview.primaryColor }} />
                        {storePreview.primaryColor}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={goBack} disabled={stepIndex === 0 || submitting} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-45">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          {currentStep.id === 'confirm' ? (
            <button type="button" onClick={createStore} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_44px_rgba(102,192,244,0.22)] transition hover:brightness-110 disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Crear mi tienda
            </button>
          ) : (
            <button type="button" onClick={goNext} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_44px_rgba(102,192,244,0.22)] transition hover:brightness-110 disabled:opacity-60">
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.92),rgba(8,12,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Preview de tienda</p>
        <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,32,0.96),rgba(9,14,24,0.98))]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{storePreview.name}</p>
                <p className="mt-1 text-sm text-slate-300">{storePreview.shortDescription}</p>
              </div>
              <span className="inline-flex h-10 w-10 rounded-full border border-white/10" style={{ backgroundColor: storePreview.primaryColor }} />
            </div>
          </div>
          <div className="p-5">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">URL</p>
              <p className="mt-2 text-sm font-semibold text-white">advancedretro.es/tiendas/{storePreview.slug || 'tu-slug'}</p>
            </div>
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Tema</p>
              <p className="mt-2 text-sm text-white">{storePreview.themeLabel}</p>
            </div>
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Límite por membresía</p>
              <p className="mt-2 text-sm text-white">{membershipTier === 'vip' ? 'Productos ilimitados + analytics básicos' : 'Hasta 10 productos activos'}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
