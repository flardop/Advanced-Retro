'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@/lib/membership';

const faqs = [
  {
    question: '¿Esto sustituye a la tienda actual?',
    answer:
      'No. La tienda oficial sigue siendo el núcleo comercial de AdvancedRetro. Las membresías añaden ventajas y acceso a capas nuevas del ecosistema.',
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer:
      'Sí. La cancelación detiene la renovación futura y mantienes acceso hasta el final del periodo activo.',
  },
  {
    question: '¿La tienda personal está incluida?',
    answer:
      'Sí. Desde Coleccionista puedes lanzar una tienda propia con hasta 10 productos. VIP Retro desbloquea catálogo ilimitado y presentación más libre.',
  },
  {
    question: '¿Qué diferencia real hay entre Coleccionista y VIP?',
    answer:
      'Coleccionista da acceso preferente y una primera tienda funcional. VIP suma más ventaja comercial, más libertad estética y una capa más premium dentro del ecosistema.',
  },
];

const comparisonRows = [
  {
    label: 'Descuento en tienda oficial',
    values: ['—', '5%', '10%'],
  },
  {
    label: 'Acceso anticipado a drops',
    values: ['—', '24h', '72h'],
  },
  {
    label: 'Participaciones en ruleta',
    values: ['1/mes', '3/mes', 'Ilimitadas'],
  },
  {
    label: 'Tienda personal',
    values: ['No', 'Hasta 10 productos', 'Ilimitada'],
  },
  {
    label: 'Branding visible de AdvancedRetro',
    values: ['Sí', 'Sí', 'No visible'],
  },
];

export default function MembershipPlans() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const helperCopy = useMemo(
    () =>
      billingPeriod === 'yearly'
        ? 'Modo anual activo · mejor valor para quien quiere quedarse dentro del ecosistema'
        : 'Modo mensual activo · flexibilidad para subir de nivel cuando lo necesites',
    [billingPeriod]
  );

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.92),rgba(8,12,20,0.97))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-8 lg:p-10">
        <div className="mx-auto max-w-[940px] text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary">
            <Sparkles className="h-4 w-4" />
            AdvancedRetro Memberships
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            ELIGE TU NIVEL
          </h1>
          <p className="mx-auto mt-5 max-w-[48rem] text-base leading-8 text-slate-300 sm:text-lg">
            AdvancedRetro sigue siendo una tienda oficial, pero ahora también es comunidad, acceso preferente, herramientas para vender y una capa premium para quien quiere estar más dentro.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            {[
              { key: 'monthly', label: 'Mensual' },
              { key: 'yearly', label: 'Anual' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setBillingPeriod(item.key as 'monthly' | 'yearly')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  billingPeriod === item.key
                    ? 'bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] text-slate-950 shadow-[0_12px_32px_rgba(102,192,244,0.22)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">{helperCopy}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => {
          const recommended = plan.tier === 'collector';
          const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const suffix = billingPeriod === 'yearly' ? '/año' : '/mes';

          return (
            <article
              key={plan.tier}
              className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8 ${
                recommended
                  ? 'border-primary/40 bg-[linear-gradient(180deg,rgba(13,21,35,0.98),rgba(10,18,30,0.94))]'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))]'
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-45`} />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-white/48">{plan.tagline}</p>
                    <h2 className="mt-3 text-3xl font-black text-white">{plan.name}</h2>
                  </div>
                  {plan.badge ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-black text-white">
                    {price === 0 ? '0€' : `${price.toString().replace('.', ',')}€`}
                  </span>
                  <span className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/48">{suffix}</span>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">{plan.description}</p>

                <ul className="mt-8 space-y-3 text-sm text-slate-200">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit.label} className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${benefit.emphasized ? 'bg-primary/18 text-primary' : 'bg-white/10 text-white/74'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className={benefit.emphasized ? 'font-semibold text-white' : ''}>{benefit.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                      recommended
                        ? 'bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] text-slate-950 hover:brightness-110'
                        : 'border border-white/12 bg-white/[0.04] text-white hover:border-white/24 hover:bg-white/[0.08]'
                    }`}
                  >
                    Entrar y continuar
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.88),rgba(8,12,20,0.94))] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-primary">Comparativa rápida</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Qué desbloquea cada nivel</h2>
          </div>
          <p className="max-w-[30rem] text-sm leading-7 text-slate-300">
            El valor principal está pensado alrededor de lo que ya existe: tienda oficial, ruleta, subastas, comunidad, creador de tiendas y acceso preferente.
          </p>
        </div>

        <div className="overflow-x-auto rounded-[1.6rem] border border-white/10 bg-white/[0.03]">
          <div className="grid min-w-[560px] grid-cols-[minmax(170px,1.2fr)_repeat(3,minmax(120px,1fr))] text-sm">
            <div className="border-b border-white/10 px-4 py-4 text-white/55">Beneficio</div>
            {MEMBERSHIP_PLANS.map((plan) => (
              <div key={`head-${plan.tier}`} className="border-b border-l border-white/10 px-4 py-4 text-center font-semibold text-white">
                {plan.name}
              </div>
            ))}
            {comparisonRows.map((row) => (
              <div key={row.label} className="contents">
                <div key={`label-${row.label}`} className="border-b border-white/10 px-4 py-4 text-slate-300">
                  {row.label}
                </div>
                {row.values.map((value, index) => (
                  <div key={`${row.label}-${index}`} className="border-b border-l border-white/10 px-4 py-4 text-center text-slate-200">
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.88),rgba(8,12,20,0.94))] p-6 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
              <summary className="cursor-pointer list-none text-base font-semibold text-white">{faq.question}</summary>
              <p className="mt-3 text-sm leading-7 text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
