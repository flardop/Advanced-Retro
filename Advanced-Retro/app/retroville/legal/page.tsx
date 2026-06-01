import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const bodyFont = DM_Sans({ subsets: ['latin'] });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'Aviso legal de Retroville | AdvancedRetro.es',
  description:
    'Aviso legal de Retroville: titularidad, propiedad intelectual, uso permitido, prohibiciones, licencias y contacto para permisos.',
  alternates: {
    canonical: 'https://advancedretro.es/retroville/legal',
  },
  openGraph: {
    title: 'Aviso legal de Retroville',
    description: 'Protección legal del universo, personajes, arte y materiales de Retroville.',
    url: 'https://advancedretro.es/retroville/legal',
    siteName: 'AdvancedRetro.es',
    locale: 'es_ES',
    type: 'website',
  },
};

const protectedAssets = [
  'Personajes, nombres, personalidades, diseños y expresiones.',
  'Ilustraciones, renders, bocetos, hojas de estilo, modelos y concept art.',
  'Logotipos, signos visuales, paletas, textos, frases, historia, lore y world building.',
  'Material promocional, piezas publicadas en web, redes sociales, presentaciones y archivos internos.',
];

const forbiddenUses = [
  'Copiar, republicar, vender, revender o distribuir material de Retroville sin autorización escrita.',
  'Crear merchandising, NFTs, productos, anuncios, videojuegos, vídeos o piezas derivadas usando personajes o arte de Retroville.',
  'Usar imágenes, personajes, bocetos o nombres para entrenar, afinar o alimentar sistemas de inteligencia artificial sin permiso.',
  'Modificar o presentar materiales de Retroville como obra propia, encargo propio o proyecto independiente.',
  'Usar Retroville, NOX, Luna, Button Crew u otros personajes de forma que pueda confundir sobre autoría, colaboración o patrocinio.',
];

export default function RetrovilleLegalPage() {
  return (
    <main className={`${bodyFont.className} min-h-screen bg-[#04040a] text-white`}>
      <section className="relative overflow-hidden px-6 py-8 sm:px-10 lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,201,64,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,60,32,0.12),transparent_28%),linear-gradient(180deg,#070712,#04040a)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-12 flex flex-wrap items-center justify-between gap-4" aria-label="Navegación aviso legal Retroville">
            <Link
              href="/retroville"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm text-white/78 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a Retroville
            </Link>
            <Image
              src="/images/retroville/retroville-logo.png"
              alt="Retroville"
              width={220}
              height={120}
              className="h-16 w-auto object-contain"
              priority
            />
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
            <div>
              <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#ffc940]`}>Aviso legal creativo</p>
              <h1 className={`${displayFont.className} mt-5 max-w-4xl text-[clamp(4rem,10vw,8rem)] uppercase leading-[0.84] tracking-[0.03em]`}>
                Protección del universo Retroville
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-9 text-white/68">
                Retroville es una serie y universo narrativo original creado dentro del ecosistema AdvancedRetro. Este aviso resume de forma clara qué materiales están protegidos, qué usos no están permitidos y cómo solicitar permiso para colaboraciones, prensa o licencias.
              </p>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="flex items-center gap-3 text-[#00ff88]">
                <ShieldCheck className="h-6 w-6" />
                <span className={`${monoFont.className} text-xs uppercase tracking-[0.22em]`}>Estado</span>
              </div>
              <p className="mt-5 text-2xl font-black text-white">Todos los derechos reservados.</p>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Salvo autorización expresa por escrito, ningún contenido de Retroville puede ser usado para fines comerciales, promocionales, editoriales o derivados.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 sm:px-10 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-[#0d0d16] p-6 sm:p-8">
            <h2 className={`${displayFont.className} text-4xl uppercase tracking-[0.03em]`}>Titularidad</h2>
            <p className="mt-5 text-base leading-8 text-white/64">
              Los personajes, diseños, nombres, ilustraciones, bocetos, renders, textos, conceptos, mundo narrativo y materiales asociados a Retroville pertenecen a sus creadores y a AdvancedRetro, salvo que se indique expresamente lo contrario. Su publicación online no supone cesión de derechos ni licencia automática de uso.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#0d0d16] p-6 sm:p-8">
            <h2 className={`${displayFont.className} text-4xl uppercase tracking-[0.03em]`}>Qué está protegido</h2>
            <ul className="mt-5 space-y-3 text-base leading-7 text-white/64">
              {protectedAssets.map((asset) => (
                <li key={asset} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ffc940]" />
                  <span>{asset}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[2rem] border border-[#ff3c20]/24 bg-[linear-gradient(180deg,rgba(255,60,32,0.08),rgba(13,13,22,0.96))] p-6 sm:p-8 lg:col-span-2">
            <h2 className={`${displayFont.className} text-4xl uppercase tracking-[0.03em] text-[#ff7a64]`}>Usos no autorizados</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {forbiddenUses.map((use) => (
                <div key={use} className="rounded-2xl border border-white/8 bg-black/18 p-5 text-sm leading-7 text-white/66">
                  {use}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-white/56">
              Cualquier uso no autorizado podrá dar lugar a la retirada del contenido, reclamaciones ante plataformas, solicitud de compensación por daños, y las acciones legales que correspondan según la normativa aplicable.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#0d0d16] p-6 sm:p-8">
            <h2 className={`${displayFont.className} text-4xl uppercase tracking-[0.03em]`}>Uso permitido limitado</h2>
            <p className="mt-5 text-base leading-8 text-white/64">
              Se permite compartir enlaces oficiales a Retroville y mencionar el proyecto en redes, prensa o contenido informativo, siempre que se respete la autoría, no se alteren los materiales y no exista finalidad comercial ni apariencia de colaboración oficial sin permiso.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#0d0d16] p-6 sm:p-8">
            <h2 className={`${displayFont.className} text-4xl uppercase tracking-[0.03em]`}>Permisos y licencias</h2>
            <p className="mt-5 text-base leading-8 text-white/64">
              Para colaboraciones, prensa, licencias, uso editorial, eventos, distribución, merchandising o acuerdos comerciales, solicita autorización previa por escrito.
            </p>
            <a
              href="mailto:flardop44@gmail.com?subject=Permiso%20o%20licencia%20Retroville"
              className="mt-6 inline-flex min-h-[48px] items-center gap-3 rounded-full bg-[#ffc940] px-6 font-black text-[#160f08] transition hover:scale-[1.02]"
            >
              <Mail className="h-4 w-4" /> Solicitar permiso
            </a>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 text-sm leading-7 text-white/50 lg:col-span-2">
            <strong className="text-white/76">Nota importante:</strong> este texto es una base informativa para proteger el proyecto en la web. No sustituye el asesoramiento de un abogado especializado en propiedad intelectual, marcas o contratos. Para una protección más fuerte, conviene valorar registro de marcas, diseños, contratos de cesión/colaboración y depósito/registro de materiales clave.
          </article>
        </div>
      </section>
    </main>
  );
}
