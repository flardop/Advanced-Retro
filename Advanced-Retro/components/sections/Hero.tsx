import Link from 'next/link';
import Image from 'next/image';

const quickLinks = [
  { label: 'Game Boy', href: '/tienda?category=platform:game-boy' },
  { label: 'Game Boy Color', href: '/tienda?category=platform:game-boy-color' },
  { label: 'Game Boy Advance', href: '/tienda?category=platform:game-boy-advance' },
  { label: 'Super Nintendo', href: '/tienda?category=platform:super-nintendo' },
  { label: 'GameCube', href: '/tienda?category=platform:gamecube' },
];

export default function Hero() {
  return (
    <section className="hero-section section relative overflow-hidden pt-6 sm:pt-8">
      <div className="absolute inset-0 bg-radial" />
      <div className="container relative">
        <div className="hero-shell glass overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.06fr,0.94fr]">
            <div className="hero-copy p-6 sm:p-8 lg:p-10">
              <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2">
                <span className="chip">Retro verificado</span>
                <span className="chip">Envío desde España</span>
                <span className="chip">Soporte real</span>
              </div>

              <h1 className="title-display mt-4 text-3xl sm:text-5xl lg:text-[3.4rem]">
                Catálogo retro profesional sin ruido.
              </h1>

              <p className="mt-4 max-w-[60ch] text-base text-textMuted sm:text-lg">
                Juegos, consolas y piezas de coleccionismo con fichas claras, stock real y opciones para
                completar tu edición sin perder tiempo.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/tienda" className="button-primary text-center">
                  Explorar tienda
                </Link>
                <Link href="/comunidad" className="button-secondary text-center">
                  Marketplace comunidad
                </Link>
                <Link href="/servicio-compra" className="button-secondary text-center">
                  Encargo 1:1
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="chip shrink-0 hover:border-primary/50 hover:text-text">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-[rgba(10,18,31,0.62)] p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">Preparación</p>
                  <p className="mt-1 text-base font-semibold text-primary">24-48h</p>
                </div>
                <div className="rounded-xl border border-line bg-[rgba(10,18,31,0.62)] p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">Cobertura</p>
                  <p className="mt-1 text-base font-semibold text-primary">Multiconsola</p>
                </div>
                <div className="rounded-xl border border-line bg-[rgba(10,18,31,0.62)] p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">Atención</p>
                  <p className="mt-1 text-base font-semibold text-primary">Ticket privado</p>
                </div>
              </div>
            </div>

            <div className="hero-media border-t border-line/80 bg-[linear-gradient(160deg,#10213a,#0b1728)] p-4 sm:p-6 lg:border-l lg:border-t-0">
              <div className="relative h-[300px] overflow-hidden rounded-xl border border-line sm:h-[360px]">
                <Image
                  src="/logo.png"
                  alt="Advanced Retro"
                  fill
                  className="object-contain p-8 opacity-90 logo-breath photo-hover-pop"
                  priority
                  sizes="(max-width: 1024px) 92vw, 44vw"
                />
                <div className="absolute left-3 top-3 rounded-full border border-primary/35 bg-[rgba(6,15,27,0.78)] px-3 py-1 text-xs text-primary">
                  Catálogo actualizado
                </div>
                <div className="absolute right-3 top-3 rounded-full border border-line bg-[rgba(6,15,27,0.78)] px-3 py-1 text-xs text-textMuted">
                  Compra segura
                </div>
                <div className="absolute inset-x-0 bottom-0 grid gap-2 border-t border-line/70 bg-[rgba(5,11,20,0.9)] p-3 sm:grid-cols-3">
                  <p className="text-xs text-textMuted">Game Boy</p>
                  <p className="text-xs text-textMuted">Nintendo clásico</p>
                  <p className="text-xs text-textMuted">Comunidad activa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
