'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { RetroStorageAuctionDetail } from '@/lib/retroStorageAuctionTypes';

type DetailResponse = {
  auction: RetroStorageAuctionDetail;
};

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format((Number(cents || 0) || 0) / 100);
}

function formatRelativeCountdown(targetIso: string, now: number): string {
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  if (diff <= 0) return '00:00';
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: RetroStorageAuctionDetail['status']) {
  switch (status) {
    case 'live':
      return 'En subasta';
    case 'upcoming':
      return 'Proximamente';
    default:
      return 'Finalizado';
  }
}

export default function RetroStorageAuctionDetailView({
  slug,
  initialAuction = null,
}: {
  slug: string;
  initialAuction?: RetroStorageAuctionDetail | null;
}) {
  const [auction, setAuction] = useState<RetroStorageAuctionDetail | null>(initialAuction);
  const [loading, setLoading] = useState(!initialAuction);
  const [now, setNow] = useState(() => Date.now());
  const [bidAmount, setBidAmount] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/auctions/${slug}`, { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as DetailResponse | null;
      if (!res.ok || !data?.auction) throw new Error((data as any)?.error || 'No se pudo cargar el lote');
      setAuction(data.auction);
      setBidAmount((current) => current || String(data.auction.nextBidCents));
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el lote');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => load(), 8000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(poll);
    };
  }, [load]);

  const nextBidLabel = useMemo(() => {
    if (!auction) return '';
    return toEuro(auction.nextBidCents);
  }, [auction]);

  const updateAuctionFromResponse = async (res: Response, fallbackMessage: string) => {
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.auction) {
      throw new Error(data?.error || fallbackMessage);
    }
    setAuction(data.auction);
    setBidAmount(String(data.auction.nextBidCents));
  };

  const performAction = async (key: string, action: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await action();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo completar la accion');
    } finally {
      setBusyAction(null);
    }
  };

  const submitBid = async () => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para pujar.');
      return;
    }

    await performAction('bid', async () => {
      const res = await fetch(`/api/auctions/${slug}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Number(bidAmount || 0) }),
      });
      await updateAuctionFromResponse(res, 'No se pudo registrar la puja');
      toast.success('Puja registrada');
    });
  };

  const toggleReminder = async () => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para guardar recordatorios.');
      return;
    }

    await performAction('reminder', async () => {
      const res = await fetch(`/api/auctions/${slug}/reminder`, { method: 'POST' });
      await updateAuctionFromResponse(res, 'No se pudo actualizar el recordatorio');
    });
  };

  const sendMessage = async (kind: 'message' | 'reaction', body: string) => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para participar en el chat.');
      return;
    }

    await performAction(`chat-${kind}`, async () => {
      const res = await fetch(`/api/auctions/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, body }),
      });
      await updateAuctionFromResponse(res, 'No se pudo enviar el mensaje');
      setChatMessage('');
    });
  };

  const requestInterest = async (action: 'buy' | 'rent') => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para dejar tu solicitud.');
      return;
    }

    await performAction(action, async () => {
      const res = await fetch(`/api/auctions/${slug}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await updateAuctionFromResponse(res, 'No se pudo registrar la solicitud');
      toast.success(action === 'buy' ? 'Solicitud de compra guardada' : 'Solicitud de alquiler guardada');
    });
  };

  const revealAuction = async () => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para abrir el almacen.');
      return;
    }

    await performAction('reveal', async () => {
      const res = await fetch(`/api/auctions/${slug}/reveal`, {
        method: 'POST',
      });
      await updateAuctionFromResponse(res, 'No se pudo abrir el almacen');
      toast.success('Almacen abierto');
    });
  };

  const reportMessage = async (messageId: string) => {
    if (!auction?.isAuthenticated) {
      toast('Inicia sesion para reportar un mensaje.');
      return;
    }

    await performAction(`report-${messageId}`, async () => {
      const res = await fetch(`/api/auctions/${slug}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reason: 'Revision de moderacion solicitada' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo reportar el mensaje');
      toast.success('Mensaje enviado a moderacion');
      await load();
    });
  };

  if (loading && !auction) {
    return (
      <section className="section">
        <div className="wide-content-rail">
          <div className="glass p-6 text-textMuted">Cargando lote...</div>
        </div>
      </section>
    );
  }

  if (!auction) {
    return (
      <section className="section">
        <div className="wide-content-rail">
          <div className="glass p-6 text-textMuted">No se pudo cargar este lote.</div>
        </div>
      </section>
    );
  }

  const countdownTarget = auction.status === 'upcoming' ? auction.startsAt : auction.effectiveEndsAt;
  const winnerCanList = auction.status === 'ended' && auction.isRevealed && auction.currentUserId && auction.winnerUserId === auction.currentUserId;

  return (
    <section className="section">
      <div className="wide-content-rail space-y-6">
        <div className="glass overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[440px,1fr]">
            <div className={`auction-vault-panel relative overflow-hidden rounded-[1.4rem] border border-line/80 ${auction.status === 'live' ? 'auction-live-shell' : ''}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_84%_20%,rgba(232,121,249,0.22),transparent_36%)]" />
              <Image
                src={auction.image}
                alt={auction.title}
                width={900}
                height={900}
                className={`h-full min-h-[340px] w-full object-contain p-8 transition duration-700 ${
                  auction.previewMode === 'blur' && !auction.isRevealed
                    ? 'scale-[1.08] blur-[11px] opacity-70'
                    : auction.previewMode === 'partial' && !auction.isRevealed
                      ? 'scale-[1.03]'
                      : ''
                }`}
              />
              {auction.previewMode === 'partial' && !auction.isRevealed ? (
                <div className="absolute inset-y-0 right-0 w-[34%] bg-[linear-gradient(90deg,transparent,rgba(8,14,25,0.66)_35%,rgba(8,14,25,0.97))]" />
              ) : null}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="chip border-cyan-400/40 bg-cyan-400/10 text-cyan-200">{statusLabel(auction.status)}</span>
                <span className="chip border-white/10 bg-[rgba(8,14,25,0.72)] text-white/80">{auction.warehouseCode}</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[rgba(8,14,25,0.72)] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Minimo garantizado</p>
                <p className="mt-2 text-sm text-textMuted">{auction.guaranteedMinimum}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">{auction.category}</p>
                  <h1 className="mt-2 title-display text-4xl">{auction.title}</h1>
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-textMuted">{auction.subtitle}</p>
                </div>
                <span className="chip border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100">{auction.rarityLabel}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Puja actual</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{toEuro(auction.currentBidCents)}</p>
                  <p className="mt-1 text-xs text-textMuted">Siguiente minimo {nextBidLabel}</p>
                </div>
                <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Cuenta atras</p>
                  <p className="mt-2 text-2xl font-semibold">{auction.status === 'ended' ? 'Cerrado' : formatRelativeCountdown(countdownTarget, now)}</p>
                  <p className="mt-1 text-xs text-textMuted">
                    {auction.status === 'upcoming' ? 'Arranca' : 'Cierra'} {formatDateTime(countdownTarget)}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Ganador actual</p>
                  <p className="mt-2 text-2xl font-semibold">{auction.winnerName || 'Sin lider'}</p>
                  <p className="mt-1 text-xs text-textMuted">{auction.bidsCount} pujas registradas</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.15fr,0.85fr]">
                <div className="rounded-[1.3rem] border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Panel de puja</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={bidAmount}
                      onChange={(event) => setBidAmount(event.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-line bg-[rgba(6,12,22,0.72)] px-4 py-3 text-sm text-text outline-none focus:border-primary/50"
                      placeholder={String(auction.nextBidCents)}
                    />
                    <button
                      type="button"
                      onClick={submitBid}
                      disabled={busyAction === 'bid' || !auction.canBid}
                      className="button-primary whitespace-nowrap disabled:opacity-60"
                    >
                      {auction.status === 'live' ? 'Pujar ahora' : 'Puja cerrada'}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="button-secondary" onClick={toggleReminder} disabled={busyAction === 'reminder'}>
                      {auction.isReminderActive ? 'Quitar recordatorio' : 'Guardar recordatorio'}
                    </button>
                    <a href={`/api/auctions/${slug}/calendar`} className="button-secondary">
                      Anadir a calendario
                    </a>
                    {auction.modes.includes('buy') ? (
                      <button type="button" className="button-secondary" onClick={() => requestInterest('buy')} disabled={busyAction === 'buy'}>
                        Solicitar compra
                      </button>
                    ) : null}
                    {auction.modes.includes('rent') ? (
                      <button type="button" className="button-secondary" onClick={() => requestInterest('rent')} disabled={busyAction === 'rent'}>
                        Solicitar alquiler
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-textMuted">
                    <span className="chip">Recordatorios {auction.remindersCount}</span>
                    <span className="chip">Compra {auction.buyRequestsCount}</span>
                    <span className="chip">Alquiler {auction.rentRequestsCount}</span>
                    {auction.isExtended ? <span className="chip border-cyan-400/30 bg-cyan-400/10 text-cyan-200">Extension activa</span> : null}
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Verificacion y custodia</p>
                  <ul className="mt-4 space-y-3 text-sm text-textMuted">
                    {auction.verificationChecklist.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {auction.rentFeeCentsPerMonth ? (
                    <div className="mt-4 rounded-2xl border border-line/80 bg-[rgba(6,12,22,0.66)] p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-primary">Almacenamiento</p>
                      <p className="mt-2 text-sm text-textMuted">
                        {toEuro(auction.rentFeeCentsPerMonth)} / mes · gracia {auction.rentGraceDays || 0} dias.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Pistas del contenido</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {auction.hints.map((hint) => (
                  <div key={hint.id} className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                    <p className="text-sm font-semibold">{hint.title}</p>
                    <p className="mt-2 text-sm text-textMuted">{hint.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Apertura del almacen</p>
                  <h2 className="mt-2 text-2xl font-semibold">Contenido final</h2>
                </div>
                {auction.canReveal ? (
                  <button type="button" className="button-primary" onClick={revealAuction} disabled={busyAction === 'reveal'}>
                    Abrir almacen
                  </button>
                ) : null}
              </div>

              {!auction.isRevealed ? (
                <div className="mt-5 rounded-[1.3rem] border border-dashed border-line bg-[rgba(8,14,25,0.34)] p-6 text-sm text-textMuted">
                  {auction.status === 'ended'
                    ? 'El lote ya ha cerrado. Falta ejecutar la apertura para mostrar el contenido completo.'
                    : 'El contenido completo se mostrara al finalizar la subasta para mantener emocion sin perder trazabilidad.'}
                </div>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {auction.revealedContents.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-[1.2rem] border border-emerald-400/18 bg-[rgba(8,14,25,0.42)] p-4"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">{item.itemType}</p>
                        </div>
                        <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                          {item.verified ? 'Verificado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-textMuted">Estado: {item.condition}</p>
                      <p className="mt-1 text-sm text-textMuted">Valor estimado: {toEuro(item.estimatedValueCents)}</p>
                      <p className="mt-2 text-xs text-textMuted">
                        {item.marketplaceReady ? 'Listo para marketplace' : 'Requiere validacion adicional antes de listar'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {winnerCanList ? (
                <div className="mt-5 rounded-[1.3rem] border border-cyan-400/24 bg-cyan-400/8 p-4">
                  <p className="text-sm font-semibold text-cyan-100">Este lote se asigna a tu perfil como ganador actual.</p>
                  <p className="mt-2 text-sm text-textMuted">
                    Cuando Advanced Retro cierre la verificacion final, podras mover piezas directamente al marketplace.
                  </p>
                  <Link href="/comunidad" className="button-secondary mt-4">
                    Ir al marketplace
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Historial de pujas</p>
              <div className="mt-4 space-y-3">
                {auction.bids.length ? (
                  auction.bids.map((bid, index) => (
                    <div key={bid.id} className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            #{auction.bids.length - index} · {bid.authorName}
                          </p>
                          <p className="mt-1 text-xs text-textMuted">{formatDateTime(bid.createdAt)}</p>
                        </div>
                        <span className="chip text-primary">{toEuro(bid.amountCents)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-textMuted">Todavia no hay pujas registradas.</p>
                )}
              </div>
            </div>

            <div className="glass p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Chat del evento</p>
                  <h2 className="mt-2 text-xl font-semibold">Canal en directo</h2>
                </div>
                <span className="chip">Moderacion {auction.reportsCount}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['🔥', '👀', '💙', '🕹️', '💎'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="chip hover:border-primary/40 hover:text-text"
                    onClick={() => sendMessage('reaction', emoji)}
                    disabled={busyAction === 'chat-reaction'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {auction.chat.length ? (
                  auction.chat.map((message) => (
                    <div key={message.id} className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {message.authorName}{' '}
                            <span className="text-xs font-normal uppercase tracking-[0.16em] text-textMuted">
                              {message.kind === 'reaction' ? 'reaccion' : 'mensaje'}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-textMuted">{message.body}</p>
                          <p className="mt-2 text-xs text-textMuted">{formatDateTime(message.createdAt)}</p>
                        </div>
                        <button
                          type="button"
                          className="chip"
                          onClick={() => reportMessage(message.id)}
                          disabled={busyAction === `report-${message.id}`}
                        >
                          Reportar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-textMuted">Todavia no hay mensajes en el canal.</p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <textarea
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  rows={4}
                  placeholder="Comparte opinion, pregunta por las pistas o comenta el ritmo de la subasta..."
                  className="w-full rounded-[1.2rem] border border-line bg-[rgba(6,12,22,0.72)] px-4 py-3 text-sm text-text outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => sendMessage('message', chatMessage)}
                  disabled={busyAction === 'chat-message'}
                >
                  Enviar mensaje
                </button>
              </div>
            </div>

            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Transparencia</p>
              <p className="mt-3 text-sm leading-relaxed text-textMuted">{auction.transparencyNote}</p>
              <p className="mt-3 text-sm leading-relaxed text-textMuted">{auction.legalNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
