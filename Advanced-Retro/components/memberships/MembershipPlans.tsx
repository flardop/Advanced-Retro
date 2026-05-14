'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@/lib/membership';

const faqs = [
  {
    question: '¿Cómo funciona la suscripción?',
    answer:
      'Eliges un plan, accedes a sus ventajas y puedes subir, bajar o cancelar cuando quieras desde tu panel.',
  },
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer:
      'Sí. La cancelación detiene la renovación futura y mantienes acceso hasta el final del periodo pagado.',
  },
  {
    question: '¿Qué ocurre si cambio de plan?',
    answer:
      'Se recalculan tus beneficios desde el siguiente ciclo de facturación y tu acceso se actualiza automáticamente.',
  },
  {
    question: '¿La tienda personal está incluida?',
    answer:
      'Sí, desde Coleccionista puedes lanzar tu tienda dentro del ecosistema. En VIP Retro desbloqueas productos ilimitados y analytics.',
  },
];

export default function MembershipPlans() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const savingsCopy = useMemo(
    () =>
      billingPeriod === 'yearly'
        ? 'Pago anual activo · mejor valor por acceso'
        : 'Pago mensual activo · flexibilidad máxima',
    [billingPeriod]
  );

  return (
    <div className="space-y-12">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-8 lg:p-10">
        <div className="mx-auto max-w-[920px] text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary">
            <Sparkles className="h-4 w-4" />
            Ecosistema AdvancedRetro
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            ELIGE TU NIVEL
          </h1>
          <p className="mx-auto mt-5 max-w-[48rem] text-base leading-8 text-slate-300 sm:text-lg">
            AdvancedRetro ya no es solo una tienda. Es catálogo oficial, comunidad, herramientas para vendedores y una capa premium para quienes quieren entrar antes, vender mejor y construir algo propio dentro del ecosistema.
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
          <p className="text-xs uppercase tracking-[0.22em] text-white/48">{savingsCopy}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => {
          const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const suffix = billingPeriod === 'yearly' ? '/año' : '/mes';
          const recommended = plan.tier === 'collector';
          return (
            <article
              key={plan.tier}
              className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8 ${
                recommended
                  ? 'border-primary/40 bg-[linear-gradient(180deg,rgba(13,21,35,0.98),rgba(10,18,30,0.94))]'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))]'
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-50`} />
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
                  <span className="text-5xl font-black text-white">{price === 0 ? '0€' : `${price.toString().replace('.', ',')}€`}</span>
                  <span className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/48">{suffix}</span>
                </div>

                <p className="mt-5 max-w-[32rem] text-sm leading-7 text-slate-300">{plan.description}</p>

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
                    Acceder y continuar
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
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
