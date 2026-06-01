import type { Metadata } from 'next';
import Image from 'next/image';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Herramienta de verificacion retro | Dashboard de autenticidad',
  description:
    'Interfaz de verificacion para videojuegos retro con comparativa entre producto autentico y posible falsificacion, analisis tecnico y flujo de revision.',
  path: '/verificacion',
  keywords: [
    'verificacion videojuegos retro',
    'autenticidad cartuchos retro',
    'falsificacion pokemon rojo',
    'dashboard autenticidad retro',
  ],
});

type VerificationMetric = {
  label: string;
  score: number;
  note: string;
};

type VerificationProduct = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  status: string;
  confidenceLabel: string;
  confidencePercent: number;
  confidenceCaption: string;
  tone: 'auth' | 'fake';
  analysis: VerificationMetric[];
  findings: string[];
  operator: string;
  result: string;
};

const VERIFICATION_PRODUCTS: VerificationProduct[] = [
  {
    id: 'auth-red',
    name: 'Pokemon Edicion Roja',
    subtitle: 'Cartucho Game Boy - revision europea',
    image: '/images/products/consoles-extra/cartridge-dmg-front.png',
    status: 'ORIGINAL / AUTENTICO',
    confidenceLabel: '92% autentico',
    confidencePercent: 92,
    confidenceCaption: 'Coincidencia alta con referencias validadas por el equipo.',
    tone: 'auth',
    analysis: [
      {
        label: 'Calidad del plastico',
        score: 93,
        note: 'Textura uniforme, desgaste natural y tono correcto para la serie.',
      },
      {
        label: 'Estado de la etiqueta',
        score: 90,
        note: 'Impresion nitida, margenes limpios y adhesivo coherente con la epoca.',
      },
      {
        label: 'Tornillos / estructura',
        score: 95,
        note: 'Tornillo gamebit compatible y carcasa sin rebabas impropias.',
      },
      {
        label: 'Detalles internos (PCB)',
        score: 89,
        note: 'Serigrafia y distribucion interna alineadas con la base tecnica.',
      },
    ],
    findings: [
      'Molde exterior coincide con la referencia oficial DMG-01.',
      'Etiqueta con tramado fino y saturacion estable bajo revision macro.',
      'La disposicion interna reportada por el equipo coincide con la revision esperada.',
    ],
    operator: 'Equipo de autenticidad - Marta / Raul',
    result: 'Resultado final: autentico con desgaste normal de coleccion.',
  },
  {
    id: 'fake-red',
    name: 'Pokemon Edicion Azul',
    subtitle: 'Cartucho Game Boy - unidad sospechosa reportada por cliente',
    image: '/images/verification/cartucho-falso-pokemon-azul.png',
    status: 'POSIBLE FALSIFICACION',
    confidenceLabel: '35% sospechoso',
    confidencePercent: 35,
    confidenceCaption: 'La pieza presenta varios indicadores incompatibles con una unidad original.',
    tone: 'fake',
    analysis: [
      {
        label: 'Calidad del plastico',
        score: 28,
        note: 'Acabado demasiado brillante y rebabas visibles en la carcasa.',
      },
      {
        label: 'Estado de la etiqueta',
        score: 34,
        note: 'Negros poco densos y recorte irregular en el borde superior.',
      },
      {
        label: 'Tornillos / estructura',
        score: 22,
        note: 'Tornillo no coincidente con la fabricacion original y cierre inestable.',
      },
      {
        label: 'Detalles internos (PCB)',
        score: 18,
        note: 'La revision interna reportada no corresponde con la huella del modelo autentico.',
      },
    ],
    findings: [
      'Etiqueta con patron y maquetacion incompatibles con la edicion original esperada.',
      'Laterales impresos con codigos y texto fuera de estandar para una unidad autentica.',
      'La carcasa azul y el acabado frontal apuntan a repro moderna o conversion no oficial.',
    ],
    operator: 'Equipo de autenticidad - Lucia / Ivan',
    result: 'Resultado final: posible falsificacion, requiere bloqueo preventivo.',
  },
];

const PROCESS_STEPS = [
  {
    id: '01',
    title: 'Inspeccion visual',
    detail: 'El equipo revisa carcasa, etiqueta, desgaste, color y consistencia exterior.',
  },
  {
    id: '02',
    title: 'Comparacion con base de datos',
    detail: 'La herramienta cruza cada hallazgo con referencias historicas y patrones conocidos.',
  },
  {
    id: '03',
    title: 'Revision manual por el equipo',
    detail: 'Un especialista valida puntos dudosos, estructura, tornillos y evidencia interna.',
  },
  {
    id: '04',
    title: 'Resultado final',
    detail: 'Se emite el dictamen y se documenta el nivel de confianza del analisis.',
  },
];

function metricBarClass(tone: VerificationProduct['tone']) {
  return tone === 'auth'
    ? 'from-emerald-400 via-lime-300 to-cyan-300'
    : 'from-rose-500 via-orange-400 to-amber-300';
}

function statusClass(tone: VerificationProduct['tone']) {
  return tone === 'auth'
    ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-200'
    : 'border-rose-400/30 bg-rose-400/12 text-rose-200';
}

function confidenceTrackClass(tone: VerificationProduct['tone']) {
  return tone === 'auth'
    ? 'bg-[rgba(15,38,32,0.82)]'
    : 'bg-[rgba(45,18,24,0.78)]';
}

function panelGlowClass(tone: VerificationProduct['tone']) {
  return tone === 'auth'
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_42%),linear-gradient(180deg,rgba(15,23,36,0.96),rgba(9,16,27,0.98))]'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),transparent_42%),linear-gradient(180deg,rgba(15,23,36,0.96),rgba(9,16,27,0.98))]';
}

export default function VerificationPage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Verificacion', path: '/verificacion' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="section pb-0">
        <div className="container">
          <div className="content-rail">
            <BreadcrumbsNav items={[{ name: 'Inicio', href: '/' }, { name: 'Verificacion' }]} />
          </div>
        </div>
      </section>

      <section className="section pt-6">
        <div className="container">
          <div className="content-rail space-y-6">
            <div className="glass overflow-hidden rounded-[1.6rem] border border-line/80">
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(102,192,244,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(137,167,255,0.14),transparent_34%),linear-gradient(180deg,rgba(13,21,33,0.96),rgba(10,16,27,0.98))] p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[42rem]">
                    <p className="section-kicker">Dashboard de verificacion</p>
                    <h1 className="title-display mt-3 text-3xl sm:text-5xl">
                      Herramienta realista para validar videojuegos retro
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-textMuted sm:text-lg">
                      Comparativa entre una unidad autentica y una unidad sospechosa, con lectura tecnica,
                      confianza visible y trazabilidad del proceso realizado por el equipo.
                    </p>
                  </div>

                  <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line bg-[rgba(9,17,28,0.66)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-textMuted">Productos analizados</p>
                      <p className="mt-2 text-3xl font-semibold text-text">02</p>
                      <p className="mt-1 text-sm text-textMuted">Una referencia autentica y una unidad sospechosa</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-[rgba(9,17,28,0.66)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-textMuted">Pipeline de verificacion</p>
                      <p className="mt-2 text-3xl font-semibold text-text">04 pasos</p>
                      <p className="mt-1 text-sm text-textMuted">Cruce visual, tecnico y revision humana</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {VERIFICATION_PRODUCTS.map((product) => (
                <article
                  key={product.id}
                  className={`glass overflow-hidden rounded-[1.5rem] border border-line/80 ${panelGlowClass(product.tone)}`}
                >
                  <div className="border-b border-line/70 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-textMuted">Sesion analizada</p>
                        <p className="mt-1 text-sm text-textMuted">{product.operator}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(product.tone)}`}>
                        {product.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[0.9fr,1.1fr]">
                    <div className="border-b border-line/70 p-5 lg:border-b-0 lg:border-r sm:p-6">
                      <div className="relative overflow-hidden rounded-[1.3rem] border border-line/80 bg-[radial-gradient(circle_at_top,rgba(112,165,255,0.14),transparent_42%),rgba(8,14,24,0.92)]">
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
                        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]" />
                        <div className="relative h-[260px] sm:h-[320px]">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-6"
                            sizes="(max-width: 1280px) 90vw, 34vw"
                            priority={product.id === 'auth-red'}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-line/80 bg-[rgba(8,14,24,0.68)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-textMuted">Resultado final</p>
                        <p className="mt-2 text-sm leading-relaxed text-text">{product.result}</p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Unidad comparada</p>
                      <h2 className="title-display mt-2 text-2xl sm:text-3xl">{product.name}</h2>
                      <p className="mt-2 text-sm text-textMuted">{product.subtitle}</p>

                      <div className="mt-5 rounded-[1.2rem] border border-line/80 bg-[rgba(8,14,24,0.72)] p-4">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-textMuted">Indicador de confianza</p>
                            <p className="mt-2 text-2xl font-semibold text-text">{product.confidenceLabel}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(product.tone)}`}>
                            {product.confidencePercent}%
                          </span>
                        </div>
                        <div className={`mt-4 h-3 overflow-hidden rounded-full border border-line/70 ${confidenceTrackClass(product.tone)}`}>
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${metricBarClass(product.tone)}`}
                            style={{ width: `${product.confidencePercent}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm text-textMuted">{product.confidenceCaption}</p>
                      </div>

                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text">Analisis tecnico</h3>
                          <span className="chip">4 bloques</span>
                        </div>
                        <div className="grid gap-3">
                          {product.analysis.map((metric) => (
                            <div key={`${product.id}-${metric.label}`} className="rounded-[1.1rem] border border-line/80 bg-[rgba(8,14,24,0.62)] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-text">{metric.label}</p>
                                <span className="text-sm font-semibold text-text">{metric.score}%</span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${metricBarClass(product.tone)}`}
                                  style={{ width: `${metric.score}%` }}
                                />
                              </div>
                              <p className="mt-3 text-sm leading-relaxed text-textMuted">{metric.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.2rem] border border-line/80 bg-[rgba(8,14,24,0.68)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-textMuted">Hallazgos clave</p>
                        <ul className="mt-3 space-y-2">
                          {product.findings.map((finding) => (
                            <li key={`${product.id}-${finding}`} className="flex gap-2 text-sm text-textMuted">
                              <span className="mt-[0.12rem] text-primary">+</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="glass rounded-[1.5rem] border border-line/80 p-5 sm:p-6">
              <div className="max-w-[42rem]">
                <p className="section-kicker">Proceso de verificacion</p>
                <h2 className="title-display mt-3 text-2xl sm:text-3xl">Como valida el equipo cada unidad</h2>
                <p className="mt-3 text-textMuted">
                  El resultado no sale de una sola foto. La verificacion combina lectura visual,
                  referencias historicas y una ultima revision manual antes de emitir el dictamen.
                </p>
              </div>

              <div className="relative mt-6">
                <div className="absolute left-7 right-7 top-7 hidden h-px bg-line/80 lg:block" />
                <div className="grid gap-4 lg:grid-cols-4">
                  {PROCESS_STEPS.map((step) => (
                    <article key={step.id} className="relative rounded-[1.2rem] border border-line/80 bg-[rgba(9,15,26,0.82)] p-4">
                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-lg font-semibold text-primary">
                        {step.id}
                      </div>
                      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-textMuted">Paso {step.id}</p>
                      <h3 className="mt-2 text-lg font-semibold text-text">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-textMuted">{step.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
