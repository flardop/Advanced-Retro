'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { stripePromise } from '@/lib/stripe';

type MysteryPrize = {
  id: string;
  label: string;
  prize_type: 'physical_product' | 'discount_coupon' | 'other';
  stock: number | null;
  metadata: Record<string, unknown>;
};

type MysteryBox = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ticket_price: number;
  image?: string;
  available_tickets: number;
  prizes: MysteryPrize[];
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

export default function MysteryRoulette() {
  const [boxes, setBoxes] = useState<MysteryBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [spinResult, setSpinResult] = useState<any | null>(null);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [setupMessage, setSetupMessage] = useState('');

  const loadBoxes = async () => {
    setLoading(true);
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
        throw new Error(data?.error || 'No se pudieron cargar las cajas');
      }

      const nextBoxes = Array.isArray(data?.boxes) ? data.boxes : [];
      setIsAuthenticated(Boolean(data?.isAuthenticated));
      setTotalTickets(Math.max(0, Number(data?.totalTickets || 0)));
      setBoxes(nextBoxes);
      setSetupMessage('');
      if (!selectedBoxId && nextBoxes[0]?.id) {
        setSelectedBoxId(nextBoxes[0].id);
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las mystery boxes');
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
    // intentionally bootstrap once
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

  const startCheckout = async () => {
    if (!selectedBox) return;

    try {
      const res = await fetch('/api/mystery/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: selectedBox.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar pago de tirada');

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo iniciar checkout');
    }
  };

  const spin = async () => {
    if (!selectedBox) return;
    if (selectedBox.available_tickets <= 0) {
      toast.error('No tienes tickets para esta mystery box. Compra una tirada primero.');
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
      <div className="container space-y-8">
        <div className="glass p-8">
          <p className="chip inline-flex">MYSTERY BOX</p>
          <h1 className="title-display text-4xl mt-4">Ruleta de premios</h1>
          <p className="text-textMuted mt-3">
            Compra una tirada, consume un ticket y descubre tu premio con animación de ruleta.
            Los tickets solo sirven para cajas del mismo precio.
          </p>
        </div>

        {setupMessage ? (
          <div className="glass p-5 border border-red-500/40">
            <p className="text-red-300 font-semibold">Ruleta pendiente de activar en Supabase</p>
            <p className="text-textMuted mt-2">{setupMessage}</p>
            <p className="text-textMuted mt-2 text-sm">
              Abre Supabase SQL Editor y ejecuta: <code>database/mystery_roulette_bootstrap.sql</code>
            </p>
          </div>
        ) : null}

        <div className="glass p-4 border border-primary/30">
          {isAuthenticated ? (
            <p className="text-base">
              <span className="text-textMuted">Tus tiradas disponibles:</span>{' '}
              <span className="text-primary font-semibold text-xl">{totalTickets}</span>
            </p>
          ) : (
            <p className="text-textMuted text-sm">Inicia sesión para ver y usar tus tiradas disponibles.</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <div className="glass p-4">
            <h2 className="font-semibold mb-3">Cajas disponibles</h2>
            <div className="space-y-2">
              {loading ? (
                <p className="text-textMuted text-sm">Cargando cajas...</p>
              ) : boxes.length === 0 ? (
                <p className="text-textMuted text-sm">No hay mystery boxes activas.</p>
              ) : (
                boxes.map((box) => (
                  <button
                    key={box.id}
                    className={`w-full text-left border px-3 py-3 ${selectedBoxId === box.id ? 'border-primary' : 'border-line'}`}
                    onClick={() => setSelectedBoxId(box.id)}
                  >
                    <p className="font-semibold">{box.name}</p>
                    <p className="text-xs text-textMuted">{toEuro(box.ticket_price)} por tirada</p>
                    <p className="text-xs text-primary mt-1">Tus tiradas compatibles: {box.available_tickets}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="glass p-6">
            {!selectedBox ? (
              <p className="text-textMuted">Selecciona una mystery box.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-lg">{selectedBox.name}</p>
                    <p className="text-sm text-textMuted">{selectedBox.description}</p>
                    <p className="text-xs text-primary mt-1">
                      Precio ticket: {toEuro(selectedBox.ticket_price)} · Tiradas para esta caja: {selectedBox.available_tickets}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="chip" onClick={startCheckout}>Comprar tirada</button>
                    <button className="button-primary" onClick={spin} disabled={spinning}>
                      {spinning ? 'Girando...' : 'Girar ruleta'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr,300px] items-start">
                  <div className="relative mx-auto w-[320px] h-[320px]">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-primary" />

                    <div
                      className="absolute inset-0 rounded-full border-4 border-primary/60 shadow-glow"
                      style={{
                        background: wheelBackground,
                        transition: spinning ? 'transform 2.5s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'transform 0.3s ease',
                        transform: `rotate(${rotationDeg}deg)`,
                      }}
                    />

                    <div className="absolute inset-[34%] rounded-full bg-[#0b0c10] border border-line flex items-center justify-center text-xs text-textMuted text-center px-3">
                      {spinning ? 'Suerte...' : 'Pulsa GIRAR'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Premios de esta caja</p>
                    <div className="max-h-[260px] overflow-auto space-y-2 pr-1">
                      {selectedBox.prizes.map((prize, index) => {
                        const segment = SEGMENT_STYLES[index % SEGMENT_STYLES.length];
                        return (
                          <div key={prize.id} className="border border-line p-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <span
                                  className="mt-1 inline-block h-3 w-3 rounded-full border border-white/40"
                                  style={{ backgroundColor: segment.hex }}
                                />
                                <div>
                                  <p className="font-medium">{prize.label}</p>
                                  <p className="text-xs text-textMuted">Color: {segment.label} ({segment.hex})</p>
                                </div>
                              </div>
                              {prize.stock == null ? null : (
                                <p className="text-xs text-textMuted">Stock: {prize.stock}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {spinHistory.length > 0 ? (
          <div className="glass p-6">
            <h2 className="font-semibold mb-3">Tus últimas tiradas</h2>
            <div className="space-y-2">
              {spinHistory.slice(0, 10).map((spin) => (
                <div key={spin.id} className="border border-line p-3">
                  <p className="font-medium">{spin.prize_label}</p>
                  <p className="text-xs text-textMuted">{new Date(spin.created_at).toLocaleString('es-ES')}</p>
                  {spin.coupon?.code ? (
                    <p className="text-xs text-primary mt-1">
                      Cupón: {spin.coupon.code} ({spin.coupon.value}{spin.coupon.type === 'percent' ? '%' : 'c'})
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {spinResult ? (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="glass p-8 max-w-lg w-full">
              <h2 className="title-display text-3xl">Enhorabuena</h2>
              <p className="text-textMuted mt-2">Tu premio de la ruleta:</p>
              <p className="text-primary text-2xl mt-3 font-semibold">{spinResult?.prize?.label || 'Premio sorpresa'}</p>

              {spinResult?.coupon?.code ? (
                <div className="border border-primary/40 bg-primary/10 p-3 mt-4">
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
