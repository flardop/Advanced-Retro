import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import { buildRetrovilleSeriesJsonLd, getRetrovilleState } from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'FAQ de Retroville | Qué es, cuándo sale y cómo seguirlo',
  description:
    'Preguntas frecuentes de Retroville: qué es la serie, cuándo llega la primera señal, cómo seguir el proyecto y dónde ver personajes, mundo y materiales oficiales.',
  path: '/retroville/faq',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'faq retroville',
    'que es retroville',
    'cuando sale retroville',
    'retroville serie animada',
    'retroville newsletter',
    'retroville plataforma',
  ],
  image: '/images/retroville/retroville-street.png',
});

function buildFaqs(launchLabel: string) {
  return [
    {
      question: '¿Qué es Retroville?',
      answer:
        'Retroville es una serie animada original ambientada en una ciudad construida con hardware abandonado. Mezcla humor oscuro, vida de barrio y worldbuilding inspirado en la cultura del videojuego.',
    },
    {
      question: '¿Cuándo sale Retroville?',
      answer: `La primera gran señal pública del proyecto está fijada actualmente para el ${launchLabel}. Esa fecha marca el primer reveal oficial del universo.`,
    },
    {
      question: '¿Dónde puedo seguir el proyecto?',
      answer:
        'Puedes seguir Retroville desde la landing principal, la newsletter La Señal de Retroville, las redes oficiales y las subpáginas de personajes, sketchbook y press kit.',
    },
    {
      question: '¿En qué plataforma se verá?',
      answer:
        'Todavía no hay una plataforma anunciada. Ahora mismo Retroville está en fase de presentación, desarrollo de universo y preparación de materiales de serie.',
    },
    {
      question: '¿Quién está haciendo Retroville?',
      answer:
        'Retroville está siendo desarrollado por AdvancedRetro como una propiedad original con personajes, masterplan urbano, materiales visuales y documentación técnica en crecimiento.',
    },
    {
      question: '¿Qué recibo si me apunto a La Señal de Retroville?',
      answer:
        'Recibirás el aviso prioritario del primer reveal público, una señal quincenal con avances y acceso temprano a nuevos drops, materiales y archivos del desarrollo.',
    },
  ] as const;
}

export default async function RetrovilleFaqPage() {
  const { launchLabel } = await getRetrovilleState();
  const faqs = buildFaqs(launchLabel);
  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/faq',
    description:
      'Preguntas frecuentes oficiales de Retroville con respuestas claras sobre la serie, el lanzamiento, la newsletter y el estado del proyecto.',
    image: '/images/retroville/retroville-street.png',
    name: 'FAQ de Retroville',
  });
  const faqSchema = buildFaqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })));
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'FAQ', path: '/retroville/faq' },
  ]);

  return (
    <>
      <StructuredData id="retroville-faq-schema" data={[retrovilleSeriesSchema, faqSchema, breadcrumbs]} />
      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[radial-gradient(circle_at_14%_10%,rgba(138,215,255,0.14),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(155,92,255,0.12),transparent_26%),linear-gradient(180deg,#03040b_0%,#050712_56%,#03040a_100%)] text-[#f7f5ef]`}>
        <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-10">
          <nav className="mb-12 flex flex-wrap items-center justify-between gap-4" aria-label="Navegación FAQ Retroville">
            <Link
              href="/retroville"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Retroville
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link href="/retroville/press" className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:text-white">
                Press kit
              </Link>
              <Link href="/retroville/personajes" className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:text-white">
                Personajes
              </Link>
            </div>
          </nav>

          <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,24,0.98),rgba(7,9,18,0.98))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
            <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#8ad7ff]`}>Preguntas frecuentes</p>
            <h1 className={`${displayFont.className} mt-4 text-[clamp(3.1rem,8vw,5.8rem)] uppercase leading-[0.9] text-white`}>
              FAQ DE RETROVILLE
            </h1>
            <p className="mt-5 max-w-[58ch] text-base leading-8 text-white/74 sm:text-lg">
              Respuestas directas para que cualquier persona entienda qué es Retroville, cuándo se activa su primera señal pública y cómo seguir el proyecto sin perderse.
            </p>
          </header>

          <section className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-6">
                <h2 className={`${displayFont.className} text-[2rem] uppercase leading-[0.96] text-white`}>{faq.question}</h2>
                <p className="mt-4 text-sm leading-7 text-white/74 sm:text-base">{faq.answer}</p>
              </article>
            ))}
          </section>

          <footer className="mt-10 flex flex-wrap gap-3">
            <Link href="/retroville/press" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(255,191,82,0.26)] bg-[linear-gradient(135deg,rgba(255,191,82,0.22),rgba(192,57,43,0.2))] px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-[rgba(255,191,82,0.5)] hover:bg-[linear-gradient(135deg,rgba(255,191,82,0.3),rgba(192,57,43,0.28))]">
              Abrir press kit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/retroville/personajes" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 transition hover:border-white/20 hover:text-white">
              Ver personajes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
