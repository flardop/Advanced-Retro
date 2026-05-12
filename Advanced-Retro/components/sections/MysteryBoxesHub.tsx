'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SafeImage from '@/components/SafeImage';
import type { PublicMysteryBox } from '@/lib/mysteryPublic';

type MysteryBoxesHubProps = {
  initialBoxes?: PublicMysteryBox[];
  initialSetupMessage?: string;
  initialIsAuthenticated?: boolean;
  initialTotalTickets?: number;
};

function toEuro(cents: number): string {
  return `${(Number(cents || 0) / 100).toFixed(2)} €`;
}

function getBoxTone(slug: string) {
  const value = String(slug || '').toLowerCase();
  if (value.includes('vip')) {
    return {
      label: 'VIP',
      border: 'border-amber-300/30',
      pill: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
    };
  }

  if (value.includes('premium')) {
    return {
      label: 'Premium',
      border: 'border-fuchsia-300/30',
      pill: 'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100',
    };
  }

  return {
    label: 'Estándar',
    border: 'border-cyan-300/30',
    pill: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  };
}

export default function MysteryBoxesHub({
  initialBoxes = [],
  initialSetupMessage = '',
  initialIsAuthenticated = false,
  initialTotalTickets = 0,
}: MysteryBoxesHubProps) {
  const hasInitialHydratedData = initialBoxes.length > 0 || Boolean(initialSetupMessage);
  const [boxes, setBoxes] = useState<PublicMysteryBox[]>(initialBoxes);
  const [loading, setLoading] = useState(initialBoxes.length === 0 && !initialSetupMessage);
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [totalTickets, setTotalTickets] = useState(initialTotalTickets);
  const [setupMessage, setSetupMessage] = useState(initialSetupMessage);
  const [checkoutBoxId, setCheckoutBoxId] = useState<string | null>(null);

  useEffect(() => {
    const loadBoxes = async () => {
      if (!hasInitialHydratedData) {
        setLoading(true);
      }
      try {
        const res = await fetch('/api/mystery/boxes', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (data?.setupRequired) {
            setSetupMessage(String(data?.error || 'Mystery Boxes no configuradas todavía.'));
            setBoxes([]);
            setIsAuthenticated(false);
            setTotalTickets(0);
            return;
          }
          throw new Error(data?.error || 'No se pudieron cargar las mystery boxes');
        }

        setBoxes(Array.isArray(data?.boxes) ? data.boxes : []);
        setIsAuthenticated(Boolean(data?.isAuthenticated));
        setTotalTickets(Math.max(0, Number(data?.totalTickets || 0)));
        setSetupMessage('');
      } catch (error: any) {
        toast.error(error?.message || 'No se pudieron cargar las mystery boxes');
        setBoxes([]);
      } finally {
        setLoading(false);
      }
    };

    void loadBoxes();
  }, [hasInitialHydratedData]);

  const startCheckout = async (box: PublicMysteryBox) => {
    setCheckoutBoxId(box.id);
    try {
      const res = await fetch('/api/mystery/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: box.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo iniciar la compra de la tirada');
      }

      if (typeof data?.url === 'string' && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }

      throw new Error('No se recibió una URL válida para Stripe');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo iniciar la compra');
      setCheckoutBoxId(null);
    }
  };

  return (
    <section className="section">
      <div className="wide-content-rail space-y-8">
        <div className="glass overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <p className="chip w-fit border-primary/40 bg-primary/10 text-primary">MYSTERY BOXES</p>
              <div className="space-y-3">
                <h1 className="title-display text-4xl sm:text-5xl">Todas las cajas misteriosas en un solo sitio</h1>
                <p className="max-w-3xl text-base leading-relaxed text-textMuted">
                  Aquí eliges tu caja, comparas tiers y compras tu tirada. La ruleta queda reservada únicamente para gastar tickets cuando ya has pasado por Mystery Boxes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#mystery-box-grid" className="button-primary">
                  Ver cajas activas
                </a>
                <Link href="/ruleta" className="button-secondary">
                  Ya tengo tickets
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Estado de cuenta</p>
                <p className="mt-3 text-3xl font-semibold text-text">{isAuthenticated ? totalTickets : '—'}</p>
                <p className="mt-2 text-sm text-textMuted">
                  {isAuthenticated
                    ? 'Tiradas disponibles ahora mismo para tus mystery boxes.'
                    : 'Inicia sesión para comprar tiradas y ver tus tickets.'}
                </p>
              </div>

              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Flujo recomendado</p>
                <p className="mt-3 text-sm leading-relaxed text-textMuted">
                  1. Elige caja. 2. Compra tirada. 3. Recibe tickets. 4. Usa la ruleta solo para revelar tu premio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {setupMessage ? (
          <div className="glass border border-red-500/40 p-5">
            <p className="font-semibold text-red-300">Mystery Boxes pendientes de activar</p>
            <p className="mt-2 text-sm text-textMuted">{setupMessage}</p>
          </div>
        ) : null}

        <div id="mystery-box-grid" className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {loading ? (
            <div className="glass p-6 text-textMuted lg:col-span-2 2xl:col-span-3">Cargando cajas...</div>
          ) : boxes.length === 0 ? (
            <div className="glass p-6 text-textMuted lg:col-span-2 2xl:col-span-3">
              No hay mystery boxes activas ahora mismo.
            </div>
          ) : (
            boxes.map((box) => {
              const tone = getBoxTone(box.slug);
              const previewPrizes = box.prizes.slice(0, 4);

              return (
                <article key={box.id} className={`glass flex h-full flex-col overflow-hidden p-5 ${tone.border}`}>
                  <div className="relative overflow-hidden rounded-[1.2rem] border border-line/80 bg-[radial-gradient(circle_at_top,rgba(122,92,255,0.22),rgba(6,10,18,0.94))]">
                    <div className="absolute left-3 top-3 z-10">
                      <span className={`chip ${tone.pill}`}>{tone.label}</span>
                    </div>
                    <div className="relative aspect-[4/3]">
                      <SafeImage
                        src={box.image || '/images/mystery/mystery-standard.webp'}
                        fallbackSrc="/images/mystery/mystery-standard.webp"
                        alt={box.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
                        className="object-contain p-4 transition duration-500 hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-1 flex-col gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">{box.name}</h2>
                      <p className="text-sm leading-relaxed text-textMuted">{box.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Tirada</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{toEuro(box.ticket_price)}</p>
                      </div>
                      <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Premios</p>
                        <p className="mt-2 text-lg font-semibold">{box.prizes.length}</p>
                      </div>
                      <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Tus tickets</p>
                        <p className="mt-2 text-lg font-semibold">{box.available_tickets}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-primary">Preview de premios</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previewPrizes.length > 0 ? (
                          previewPrizes.map((prize) => (
                            <span key={prize.id} className="chip">
                              {prize.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-textMuted">Sin premios visibles todavía.</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        className="button-primary w-full text-center"
                        onClick={() => void startCheckout(box)}
                        disabled={checkoutBoxId === box.id}
                      >
                        {checkoutBoxId === box.id ? 'Abriendo pago...' : 'Comprar tirada'}
                      </button>
                      <Link href={`/ruleta?box=${encodeURIComponent(box.slug)}`} className="button-secondary w-full text-center">
                        Usar tickets
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
