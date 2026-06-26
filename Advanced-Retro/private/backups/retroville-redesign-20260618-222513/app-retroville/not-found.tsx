import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const bodyFont = DM_Sans({ subsets: ['latin'] });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

export default function RetrovilleNotFound() {
  return (
    <main className={`${displayFont.className} ${bodyFont.className} ${monoFont.className} min-h-screen overflow-hidden bg-[#04040a] text-white`}>
      <section className="relative flex min-h-screen items-center px-6 py-16 sm:px-10 lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,255,136,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(155,92,255,0.18),transparent_30%),linear-gradient(180deg,#05050c,#090d16_52%,#05050c)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[2.2rem] border border-white/10 bg-[rgba(8,10,18,0.82)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#00ff88]">Signal lost · 404</p>
            <h1 className="mt-5 text-[clamp(3.8rem,10vw,7.5rem)] uppercase leading-[0.84] tracking-[0.03em] text-white">
              Esta calle no existe en Retroville
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              Has aterrizado en una dirección rota dentro del universo. Lo más probable es que el cartel estuviera mal,
              que alguien borrara el save o que NOX no quiera que veas esa zona todavía.
            </p>
            <p className="mt-4 max-w-2xl text-sm uppercase tracking-[0.2em] text-[#ffc940]">
              Vuelve a la landing y entra por una ruta oficial.
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/retroville"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:brightness-110"
            >
              Volver a Retroville <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/retroville/personajes"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 text-[11px] uppercase tracking-[0.22em] text-white/82 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
            >
              Ver personajes
            </Link>
            <Link
              href="/retroville/sketches"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 text-[11px] uppercase tracking-[0.22em] text-white/82 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
            >
              Ver sketchbook
            </Link>
            <Link href="/" className="mt-2 inline-flex items-center gap-2 text-sm text-white/62 transition hover:text-[#00ff88]">
              <ArrowLeft className="h-4 w-4" /> Volver a AdvancedRetro
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
