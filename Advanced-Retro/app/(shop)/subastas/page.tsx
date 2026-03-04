import type { Metadata } from 'next';
import HypeLockboard from '@/components/sections/HypeLockboard';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Subastas retro | Temporada bloqueada',
  description:
    'Reserva plaza para la temporada de subastas de Advanced Retro. Lanzamiento bloqueado con contador y acceso anticipado.',
  path: '/subastas',
  keywords: [
    'subastas retro',
    'subastas videojuegos retro',
    'reserva subasta game boy',
    'advanced retro subastas',
  ],
});

export default function AuctionsComingSoonPage() {
  return (
    <>
      <HypeLockboard />
      <section className="section pt-0">
        <div className="container glass p-6 sm:p-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Subastas bloqueadas</p>
          <h1 className="title-display text-3xl">Temporada 1 en preparación</h1>
          <p className="text-textMuted leading-relaxed">
            Esta sección abrirá con pujas por piezas especiales, lotes exclusivos y reservas limitadas.
            Mientras está bloqueada, puedes reservar plaza para entrar con prioridad al lanzamiento.
          </p>
          <p className="text-textMuted leading-relaxed">
            El objetivo es crear tensión y expectativa: contador en tiempo real, cupos activos y desbloqueo automático cuando llegue la fecha.
          </p>
        </div>
      </section>
    </>
  );
}

