'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, FileStack, LockKeyhole } from 'lucide-react';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';

type RetrovilleProductionDeskProps = {
  mode?: 'desktop' | 'mobile';
};

type ProductionDocument = {
  title: string;
  status: 'private' | 'incoming';
  description: string;
  meta: string;
  cta: string;
};

const productionDocuments: readonly ProductionDocument[] = [
  {
    title: 'Biblia de serie · Vision general',
    status: 'private',
    description:
      'Documento base de Retroville con la premisa, el tono y el marco actual de la temporada 1. Ahora se comparte solo por solicitud directa al correo del proyecto.',
    meta: 'PDF privado · solicitud por email · 10 paginas · 18+',
    cta: 'Solicitar acceso',
  },
  {
    title: 'Season 1 playbook',
    status: 'incoming',
    description:
      'Mapa tecnico de la temporada con la continuidad de los episodios 01-10, beats, conflictos y estado de produccion.',
    meta: 'Proximo documento · temporada 1',
    cta: 'Incoming',
  },
] as const;

const episodePackets = Array.from({ length: 10 }, (_, index) => {
  const episode = index + 1;
  return {
    code: `EP ${String(episode).padStart(2, '0')}`,
    title: `Dossier episodio ${String(episode).padStart(2, '0')}`,
    description:
      episode === 1
        ? 'Sinopsis, set pieces, tono y materiales de presentacion del primer episodio.'
        : 'Documento de episodio con sinopsis, personajes implicados, barrios y progresion de temporada.',
  };
});

function statusChip(status: ProductionDocument['status']) {
  if (status === 'private') {
    return 'border-[#ffc940]/25 bg-[#ffc940]/10 text-[#ffc940]';
  }

  return 'border-white/10 bg-white/[0.04] text-white/58';
}

export default function RetrovilleProductionDesk({
  mode = 'desktop',
}: RetrovilleProductionDeskProps) {
  const isDesktop = mode === 'desktop';

  return (
    <div className={`grid gap-7 ${isDesktop ? 'xl:grid-cols-[0.92fr,1.08fr] xl:items-start' : ''}`}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-cyan)]">Production desk</p>
          <h3 className="mt-3 text-[clamp(2.5rem,4.8vw,4.4rem)] font-black uppercase leading-[0.92] text-white [font-family:var(--font-display)]">
            MATERIAL TECNICO Y BIBLIAS
          </h3>
          <p className="mt-4 max-w-[48ch] text-sm leading-7 text-white/72 sm:text-base">
            Aqui se iran abriendo los documentos de trabajo del universo. Algunos materiales se podran descargar y otros quedaran en acceso privado por solicitud directa. Lo que siga en mesa de montaje aparece bloqueado como incoming.
          </p>
        </div>

        <div className="grid gap-4">
          {productionDocuments.map((document) => (
            <article
              key={document.title}
              className="rounded-[1.5rem] border border-white/10 bg-[rgba(11,14,24,0.92)] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.24)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`inline-flex min-h-[32px] items-center rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${statusChip(document.status)}`}
                >
                  {document.status === 'private' ? 'Privado' : 'Incoming'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/42">{document.meta}</span>
              </div>
              <h4 className="mt-4 text-[1.6rem] font-black uppercase leading-[0.95] text-white [font-family:var(--font-display)]">
                {document.title}
              </h4>
              <p className="mt-3 text-sm leading-7 text-white/72">{document.description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {document.status === 'private' ? (
                  <RetrovillePrivateDocumentButton
                    documentTitle={document.title}
                    buttonLabel={document.cta}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#ffc940] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110"
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/52"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    {document.cta}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <FileStack className="mt-1 h-4 w-4 text-[var(--rv-gold)]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-gold)]">Nota de release</p>
              <p className="mt-2 text-sm leading-7 text-white/72">
                Cada archivo nuevo se publicara aqui cuando tenga suficiente nivel de presentacion. La biblia principal queda en solicitud privada y, mientras tanto, el sketchbook y el reparto completo siguen siendo la mejor forma de seguir el avance del proyecto.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/retroville/sketches"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84 transition hover:border-[var(--rv-cyan)]/30 hover:bg-white/[0.08]"
            >
              Ver sketchbook
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/retroville/personajes"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08]"
            >
              Ver personajes
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,24,0.96),rgba(7,9,18,0.96))] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Temporada 1</p>
            <h4 className="mt-3 text-[2rem] font-black uppercase leading-[0.92] text-white [font-family:var(--font-display)]">
              EPISODIOS 01-10
            </h4>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/58">
            <Clock3 className="h-4 w-4" />
            Incoming hasta nuevo release
          </div>
        </div>

        <p className="mt-4 max-w-[60ch] text-sm leading-7 text-white/72">
          La estructura de la temporada ya esta prevista como un bloque de diez episodios. Cada dossier ira desbloqueandose cuando el material tenga sinopsis, tono, barrios y personajes cerrados a nivel presentable.
        </p>

        <div className={`mt-6 grid gap-4 ${isDesktop ? 'md:grid-cols-2' : 'sm:grid-cols-2'}`}>
          {episodePackets.map((episode) => (
            <article
              key={episode.code}
              className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex min-h-[30px] items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--rv-gold)]">
                  {episode.code}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Incoming</span>
              </div>
              <h5 className="mt-3 text-[1.35rem] font-black uppercase leading-[0.95] text-white [font-family:var(--font-display)]">
                {episode.title}
              </h5>
              <p className="mt-3 text-sm leading-7 text-white/66">{episode.description}</p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/52"
              >
                <LockKeyhole className="h-4 w-4" />
                Descargar pronto
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
