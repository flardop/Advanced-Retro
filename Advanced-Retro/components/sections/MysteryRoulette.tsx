'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { PublicMysteryBox } from '@/lib/mysteryPublic';

type MysteryRouletteProps = {
  initialBoxes?: PublicMysteryBox[];
  initialSetupMessage?: string;
  initialIsAuthenticated?: boolean;
  initialTotalTickets?: number;
};

const SEGMENT_STYLES = [
  { hex: '#f43f5e', label: 'Rojo' },
  { hex: '#0ea5e9', label: 'Azul' },
  { hex: '#22c55e', label: 'Verde' },
  { hex: '#f59e0b', label: 'Naranja' },
  { hex: '#a855f7', label: 'Morado' },
  { hex: '#06b6d4', label: 'Cian' },
  { hex: '#84cc16', label: 'Lima' },
  { hex: '#fb7185', label: 'Rosa' },
];
const SEGMENT_COLORS = SEGMENT_STYLES.map((segment) => segment.hex);

function toEuro(cents: number): string {
  return `${(Number(cents || 0) / 100).toFixed(2)} €`;
}

export default function MysteryRoulette({
  initialBoxes = [],
  initialSetupMessage = '',
  initialIsAuthenticated = false,
  initialTotalTickets = 0,
}: MysteryRouletteProps) {
  const searchParams = useSearchParams();
  const [boxes, setBoxes] = useState<PublicMysteryBox[]>(initialBoxes);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [totalTickets, setTotalTickets] = useState(initialTotalTickets);
  const [loading, setLoading] = useState(initialBoxes.length === 0 && !initialSetupMessage);
  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [spinResult, setSpinResult] = useState<any | null>(null);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [setupMessage, setSetupMessage] = useState(initialSetupMessage);
  const preferredBoxSlug = String(searchParams?.get('box') || '').trim().toLowerCase();

  const loadBoxes = async () => {
    const shouldShowLoadingState = boxes.length === 0 && !setupMessage;
    if (shouldShowLoadingState) {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/mystery/boxes', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.setupRequired) {
          const msg = String(data?.error || 'Ruleta no configurada en base de datos.');
          setSetupMessage(msg);
          setBoxes([]);
          setSelectedBoxId('');
          setIsAuthenticated(false);
          setTotalTickets(0);
          return;
        }
        throw new Error(data?.error || 'No se pudieron cargar los tickets de ruleta');
      }

      const nextBoxes = Array.isArray(data?.boxes) ? data.boxes : [];
      setIsAuthenticated(Boolean(data?.isAuthenticated));
      setTotalTickets(Math.max(0, Number(data?.totalTickets || 0)));
      setBoxes(nextBoxes);
      setSetupMessage('');
      const preferredBox =
        preferredBoxSlug.length > 0
          ? nextBoxes.find((box: PublicMysteryBox) => String(box.slug || '').toLowerCase() === preferredBoxSlug) || null
          : null;
      if (preferredBox?.id) {
        setSelectedBoxId(preferredBox.id);
      } else if (!selectedBoxId && nextBoxes[0]?.id) {
        setSelectedBoxId(nextBoxes[0].id);
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar los tickets de ruleta');
      setIsAuthenticated(false);
      setTotalTickets(0);
    } finally {
      setLoading(false);
    }
  };

  const loadSpins = async () => {
    try {
      const res = await fetch('/api/mystery/spins', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok && data?.setupRequired) {
        const msg = String(data?.error || 'Ruleta no configurada en base de datos.');
        setSetupMessage(msg);
        setSpinHistory([]);
        return;
      }
      if (!res.ok) return;
      setSpinHistory(Array.isArray(data?.spins) ? data.spins : []);
    } catch {
      setSpinHistory([]);
    }
  };

  useEffect(() => {
    loadBoxes();
    loadSpins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBox = useMemo(
    () => boxes.find((box) => box.id === selectedBoxId) || boxes[0] || null,
    [boxes, selectedBoxId]
  );

  const wheelPrizes = useMemo(() => {
    const prizes = selectedBox?.prizes || [];
    if (prizes.length === 0) return [];
    return prizes.slice(0, 12);
  }, [selectedBox]);

  const wheelBackground = useMemo(() => {
    if (wheelPrizes.length === 0) {
      return 'conic-gradient(#1f2937 0deg 360deg)';
    }

    const section = 360 / wheelPrizes.length;
    const parts = wheelPrizes.map((_, index) => {
      const start = section * index;
      const end = section * (index + 1);
      const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
      return `${color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }, [wheelPrizes]);

  const spin = async () => {
    if (!selectedBox) return;
    if (selectedBox.available_tickets <= 0) {
      toast.error('No tienes tickets compatibles para esta ruleta. Compra una tirada en Mystery Boxes primero.');
      return;
    }

    setSpinning(true);
    setSpinResult(null);
    const randomExtra = 1800 + Math.floor(Math.random() * 1080);
    setRotationDeg((prev) => prev + randomExtra);

    try {
      const res = await fetch('/api/mystery/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: selectedBox.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo completar la tirada');

      setTimeout(async () => {
        setSpinResult(data);
        setSpinning(false);
        await loadBoxes();
        await loadSpins();
      }, 2500);
    } catch (error: any) {
      setSpinning(false);
      toast.error(error?.message || 'No se pudo girar la ruleta');
    }
  };

  return (
    <section className="section">
      <div className="wide-content-rail space-y-8">
        <div className="glass overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_320px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <p className="chip w-fit border-primary/40 bg-primary/10 text-primary">RULETA</p>
              <div className="space-y-3">
                <h1 className="title-display text-4xl sm:text-5xl">La ruleta es solo para gastar tickets</h1>
                <p className="max-w-3xl text-base leading-relaxed text-textMuted">
                  Aquí no se compran mystery boxes ni se comparan tiers. Esta zona queda reservada para consumir los tickets
                  que ya has conseguido y revelar el premio de la caja asociada.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/mystery-boxes" className="button-primary">
                  Ir a Mystery Boxes
                </Link>
                <a href="#roulette-wheel" className="button-secondary">
                  Ir a la ruleta
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Tickets disponibles</p>
                <p className="mt-3 text-3xl font-semibold text-text">{isAuthenticated ? totalTickets : '—'}</p>
                <p className="mt-2 text-sm text-textMuted">
                  {isAuthenticated
                    ? 'Suma total de tickets listos para gastar en ruleta.'
                    : 'Inicia sesión para ver y consumir tus tickets.'}
                </p>
              </div>

              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Separación de flujos</p>
                <p className="mt-3 text-sm leading-relaxed text-textMuted">
                  Mystery Boxes sirve para comprar. Ruleta sirve para abrir tickets y descubrir el premio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {setupMessage ? (
          <div className="glass border border-red-500/40 p-5">
            <p className="font-semibold text-red-300">Ruleta pendiente de activar en Supabase</p>
            <p className="mt-2 text-sm text-textMuted">{setupMessage}</p>
            <p className="mt-2 text-sm text-textMuted">
              Abre Supabase SQL Editor y ejecuta: <code>database/mystery_roulette_bootstrap.sql</code>
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="glass p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Canales activos</p>
                <h2 className="mt-2 text-lg font-semibold">Tus tickets por caja</h2>
              </div>
              <span className="chip">{boxes.length} activas</span>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <p className="text-sm text-textMuted">Cargando tickets...</p>
              ) : boxes.length === 0 ? (
                <p className="text-sm text-textMuted">No hay tickets activos ahora mismo.</p>
              ) : (
                boxes.map((box) => {
                  const active = selectedBoxId === box.id;
                  return (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => setSelectedBoxId(box.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(102,192,244,0.2)]'
                          : 'border-line/80 bg-[rgba(255,255,255,0.02)] hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-text">{box.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-textMuted">{box.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-primary">{box.available_tickets}</p>
                          <p className="text-[11px] text-textMuted">tickets</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">¿Te faltan tickets?</p>
              <p className="mt-2 text-sm leading-relaxed text-textMuted">
                Compra tiradas en la sección de Mystery Boxes y vuelve aquí solo cuando quieras gastar tus accesos.
              </p>
              <Link href="/mystery-boxes" className="button-secondary mt-4 inline-flex w-full justify-center">
                Comprar en Mystery Boxes
              </Link>
            </div>
          </aside>

          <div id="roulette-wheel" className="glass p-5 sm:p-6">
            {!selectedBox ? (
              <p className="text-textMuted">Selecciona un canal de tickets para activar la ruleta.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                  <div className="rounded-[1.4rem] border border-line/80 bg-[radial-gradient(circle_at_top,rgba(102,192,244,0.16),rgba(8,14,25,0.78))] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Canal seleccionado</p>
                    <h2 className="mt-3 text-2xl font-semibold text-text">{selectedBox.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-textMuted">{selectedBox.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Tickets</p>
                      <p className="mt-2 text-2xl font-semibold text-primary">{selectedBox.available_tickets}</p>
                    </div>
                    <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Premios</p>
                      <p className="mt-2 text-2xl font-semibold text-text">{selectedBox.prizes.length}</p>
                    </div>
                    <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Referencia</p>
                      <p className="mt-2 text-lg font-semibold text-text">{toEuro(selectedBox.ticket_price)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] xl:items-start">
                  <div className="rounded-[1.5rem] border border-line/80 bg-[linear-gradient(180deg,rgba(9,16,28,0.96),rgba(7,12,22,0.88))] p-4 sm:p-5">
                    <div className="relative mx-auto h-[320px] w-[320px] sm:h-[360px] sm:w-[360px]">
                      <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-primary" />

                      <div
                        className="absolute inset-0 rounded-full border-4 border-primary/60 shadow-glow"
                        style={{
                          background: wheelBackground,
                          transition: spinning ? 'transform 2.5s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'transform 0.3s ease',
                          transform: `rotate(${rotationDeg}deg)`,
                        }}
                      />

                      <div className="absolute inset-[34%] flex items-center justify-center rounded-full border border-line bg-[#0b0c10] px-3 text-center text-xs text-textMuted">
                        {spinning ? 'Suerte...' : 'Pulsa GIRAR'}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <p className="text-sm leading-relaxed text-textMuted">
                        {selectedBox.available_tickets > 0
                          ? 'Consume un ticket de este canal y la ruleta resolverá tu premio en tiempo real.'
                          : 'No te quedan tickets activos para este canal. Vuelve a Mystery Boxes cuando quieras comprar nuevas tiradas.'}
                      </p>
                      <button className="button-primary w-full sm:w-auto" onClick={spin} disabled={spinning || selectedBox.available_tickets <= 0}>
                        {spinning ? 'Girando...' : 'Girar ruleta'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-primary">Premios de este canal</p>
                      <div className="mt-4 grid gap-2">
                        {selectedBox.prizes.map((prize, index) => {
                          const segment = SEGMENT_STYLES[index % SEGMENT_STYLES.length];
                          return (
                            <div key={prize.id} className="rounded-xl border border-line/80 bg-[rgba(255,255,255,0.02)] p-3 text-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-2.5">
                                  <span
                                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full border border-white/40"
                                    style={{ backgroundColor: segment.hex }}
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-text">{prize.label}</p>
                                    <p className="text-xs text-textMuted">Segmento {segment.label}</p>
                                  </div>
                                </div>
                                {prize.stock == null ? null : <p className="text-xs text-textMuted">Stock: {prize.stock}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {spinHistory.length > 0 ? (
                      <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-primary">Tus últimas tiradas</p>
                        <div className="mt-4 space-y-2">
                          {spinHistory.slice(0, 8).map((spin) => (
                            <div key={spin.id} className="rounded-xl border border-line/80 bg-[rgba(255,255,255,0.02)] p-3">
                              <p className="font-medium text-text">{spin.prize_label}</p>
                              <p className="mt-1 text-xs text-textMuted">{new Date(spin.created_at).toLocaleString('es-ES')}</p>
                              {spin.coupon?.code ? (
                                <p className="mt-1 text-xs text-primary">
                                  Cupón: {spin.coupon.code} ({spin.coupon.value}{spin.coupon.type === 'percent' ? '%' : 'c'})
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {spinResult ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="glass w-full max-w-lg p-8">
              <h2 className="title-display text-3xl">Enhorabuena</h2>
              <p className="mt-2 text-textMuted">Tu premio de la ruleta:</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{spinResult?.prize?.label || 'Premio sorpresa'}</p>

              {spinResult?.coupon?.code ? (
                <div className="mt-4 border border-primary/40 bg-primary/10 p-3">
                  <p className="text-sm">Cupón generado:</p>
                  <p className="font-mono text-lg text-primary">{spinResult.coupon.code}</p>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button className="button-primary" onClick={() => setSpinResult(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
