'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type ListingComment = {
  id: string;
  userId?: string | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  comment: string;
  createdAt: string;
  replies?: Array<{
    id: string;
    userId?: string | null;
    authorName: string;
    authorAvatarUrl?: string | null;
    comment: string;
    createdAt: string;
  }>;
};

type ListingSocialSummary = {
  visits: number;
  likes: number;
  commentsCount: number;
  likedByCurrentVisitor: boolean;
  updatedAt?: string;
};

const EMPTY_SUMMARY: ListingSocialSummary = {
  visits: 0,
  likes: 0,
  commentsCount: 0,
  likedByCurrentVisitor: false,
};

type ReplyDraftMap = Record<string, string>;

type ReplyOpenMap = Record<string, boolean>;

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'advanced-retro-visitor-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function relativeDate(value: string): string {
  const ts = new Date(String(value || '')).getTime();
  if (!Number.isFinite(ts)) return 'Hace poco';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function avatarFallback(name: string) {
  const clean = String(name || '').trim();
  return (clean || 'AR').slice(0, 2).toUpperCase();
}

export default function CommunityListingSocialPanel({ listingId }: { listingId: string }) {
  const [visitorId, setVisitorId] = useState('');
  const [summary, setSummary] = useState<ListingSocialSummary>(EMPTY_SUMMARY);
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [canComment, setCanComment] = useState(false);
  const [canReply, setCanReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyOpen, setReplyOpen] = useState<ReplyOpenMap>({});
  const [replyDrafts, setReplyDrafts] = useState<ReplyDraftMap>({});
  const [sendingReplyFor, setSendingReplyFor] = useState<string | null>(null);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    if (!listingId || !visitorId) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const res = await fetch(
          `/api/community/listings/${encodeURIComponent(listingId)}/social?visitorId=${encodeURIComponent(visitorId)}`,
          { cache: 'no-store' }
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (data?.summary) setSummary(data.summary);
        setComments(Array.isArray(data?.comments) ? data.comments : []);
        setCanComment(Boolean(data?.canComment));
        setCanReply(Boolean(data?.canReply ?? data?.canComment));
      } catch {
        if (cancelled) return;
        setSummary(EMPTY_SUMMARY);
        setComments([]);
        setCanComment(false);
        setCanReply(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const trackVisit = async () => {
      try {
        const res = await fetch(`/api/community/listings/${encodeURIComponent(listingId)}/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'visit', visitorId }),
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.summary) setSummary(data.summary);
      } catch {
        // no-op
      }
    };

    void load();
    void trackVisit();

    return () => {
      cancelled = true;
    };
  }, [listingId, visitorId]);

  const toggleLike = async () => {
    if (!listingId || !visitorId || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/community/listings/${encodeURIComponent(listingId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like', visitorId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el me gusta');
      if (data?.summary) setSummary(data.summary);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar el me gusta');
    } finally {
      setLiking(false);
    }
  };

  const submitComment = async () => {
    const value = comment.trim();
    if (value.length < 2) {
      toast.error('Escribe al menos 2 caracteres');
      return;
    }
    if (value.length > 1200) {
      toast.error('Máximo 1200 caracteres');
      return;
    }
    if (sendingComment || !listingId || !visitorId) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/community/listings/${encodeURIComponent(listingId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          visitorId,
          comment: value,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          setCanComment(false);
        }
        throw new Error(data?.error || 'No se pudo enviar el comentario');
      }
      if (data?.summary) setSummary(data.summary);
      if (Array.isArray(data?.comments)) setComments(data.comments);
      setComment('');
      toast.success(data?.duplicate ? 'Comentario ya enviado anteriormente' : 'Comentario publicado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar el comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const submitReply = async (commentId: string) => {
    const id = String(commentId || '').trim();
    if (!id) return;
    const value = String(replyDrafts[id] || '').trim();
    if (value.length < 2) {
      toast.error('La respuesta debe tener al menos 2 caracteres');
      return;
    }
    if (value.length > 1000) {
      toast.error('La respuesta no puede superar 1000 caracteres');
      return;
    }
    if (!listingId || !visitorId || sendingReplyFor) return;

    setSendingReplyFor(id);
    try {
      const res = await fetch(`/api/community/listings/${encodeURIComponent(listingId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_to_comment',
          visitorId,
          commentId: id,
          comment: value,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          setCanReply(false);
        }
        throw new Error(data?.error || 'No se pudo enviar la respuesta');
      }
      if (data?.summary) setSummary(data.summary);
      if (Array.isArray(data?.comments)) setComments(data.comments);
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
      setReplyOpen((prev) => ({ ...prev, [id]: false }));
      toast.success(data?.duplicate ? 'Respuesta ya enviada anteriormente' : 'Respuesta publicada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar la respuesta');
    } finally {
      setSendingReplyFor(null);
    }
  };

  const visibleComments = useMemo(() => comments.slice(0, 20), [comments]);

  return (
    <div className="rounded-2xl border border-line p-4 sm:p-5 bg-[rgba(8,16,28,0.52)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Actividad del anuncio</p>
          <h2 className="text-xl font-semibold mt-1">Comunidad y seguimiento público</h2>
          <p className="text-sm text-textMuted mt-1">
            Likes y comentarios para dar contexto al anuncio (sin exponer datos privados de compra).
          </p>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          disabled={liking || !visitorId}
          className={`chip ${
            summary.likedByCurrentVisitor ? 'border-primary bg-primary/10 text-primary' : ''
          }`}
        >
          {liking ? 'Guardando...' : summary.likedByCurrentVisitor ? 'Quitar me gusta' : 'Me gusta'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
          <p className="text-xs text-textMuted">Visitas anuncio</p>
          <p className="text-xl font-semibold text-primary mt-1">{summary.visits}</p>
        </div>
        <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
          <p className="text-xs text-textMuted">Me gusta</p>
          <p className="text-xl font-semibold text-primary mt-1">{summary.likes}</p>
        </div>
        <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
          <p className="text-xs text-textMuted">Comentarios</p>
          <p className="text-xl font-semibold text-primary mt-1">{summary.commentsCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Comentarios de la comunidad</p>
          <p className="text-xs text-textMuted">{summary.commentsCount} totales</p>
        </div>

        <div className="mt-3 space-y-3">
          {canComment ? (
            <>
              <textarea
                className="w-full rounded-xl border border-line bg-[rgba(6,12,22,0.65)] px-3 py-2 text-sm text-white placeholder:text-textMuted min-h-[96px]"
                placeholder="Pregunta por estado, autenticidad o detalles visibles del anuncio..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1200}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-textMuted">{comment.trim().length}/1200</p>
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={sendingComment || comment.trim().length < 2}
                  className="button-primary disabled:opacity-60"
                >
                  {sendingComment ? 'Enviando...' : 'Publicar comentario'}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-line p-3 bg-[rgba(8,16,28,0.48)] text-sm">
              <p className="text-textMuted">
                Solo usuarios con sesión iniciada pueden comentar anuncios.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/login?redirect=${encodeURIComponent(`/comunidad/anuncio/${listingId}`)}`} className="chip text-primary border-primary">
                  Iniciar sesión para comentar
                </Link>
                <Link href="/perfil?tab=tickets" className="chip">
                  Hablar con tienda
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-textMuted">Cargando actividad del anuncio...</div>
          ) : visibleComments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-3 text-sm text-textMuted">
              Aún no hay comentarios. Puedes ser la primera persona en preguntar por este anuncio.
            </div>
          ) : (
            visibleComments.map((item) => (
              <div key={item.id} className="rounded-xl border border-line p-3 bg-[rgba(8,16,28,0.42)]">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center text-xs font-semibold">
                    {item.authorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.authorAvatarUrl}
                        alt={item.authorName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      avatarFallback(item.authorName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold line-clamp-1">{item.authorName}</p>
                      <p className="text-xs text-textMuted">{relativeDate(item.createdAt)}</p>
                    </div>
                    <p className="text-sm text-textMuted mt-1 whitespace-pre-wrap break-words">
                      {item.comment}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-textMuted">
                        {(item.replies || []).length} respuesta{(item.replies || []).length === 1 ? '' : 's'}
                      </span>
                      {canReply ? (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-primary hover:underline"
                          onClick={() =>
                            setReplyOpen((prev) => ({ ...prev, [item.id]: !Boolean(prev[item.id]) }))
                          }
                        >
                          {replyOpen[item.id] ? 'Cancelar' : 'Responder'}
                        </button>
                      ) : null}
                    </div>

                    {Array.isArray(item.replies) && item.replies.length > 0 ? (
                      <div className="mt-3 space-y-2 pl-3 border-l border-line">
                        {item.replies.map((reply) => (
                          <div key={reply.id} className="rounded-lg border border-line p-2 bg-[rgba(6,12,20,0.45)]">
                            <div className="flex items-start gap-2">
                              <div className="h-7 w-7 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center text-[10px] font-semibold">
                                {reply.authorAvatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={reply.authorAvatarUrl}
                                    alt={reply.authorName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  avatarFallback(reply.authorName)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-semibold line-clamp-1">{reply.authorName}</p>
                                  <p className="text-[11px] text-textMuted">{relativeDate(reply.createdAt)}</p>
                                </div>
                                <p className="text-xs text-textMuted mt-1 whitespace-pre-wrap break-words">
                                  {reply.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {replyOpen[item.id] ? (
                      canReply ? (
                        <div className="mt-3 rounded-xl border border-line p-3 bg-[rgba(6,12,20,0.4)]">
                          <textarea
                            className="w-full rounded-lg border border-line bg-[rgba(6,12,22,0.65)] px-3 py-2 text-xs text-white placeholder:text-textMuted min-h-[72px]"
                            placeholder="Responder a este comentario..."
                            value={replyDrafts[item.id] || ''}
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            maxLength={1000}
                          />
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] text-textMuted">
                              {String(replyDrafts[item.id] || '').trim().length}/1000
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="chip text-xs"
                                onClick={() => setReplyOpen((prev) => ({ ...prev, [item.id]: false }))}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="button-primary disabled:opacity-60 text-xs px-3 py-2"
                                onClick={() => submitReply(item.id)}
                                disabled={
                                  sendingReplyFor === item.id ||
                                  String(replyDrafts[item.id] || '').trim().length < 2
                                }
                              >
                                {sendingReplyFor === item.id ? 'Enviando...' : 'Responder'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-textMuted">
                          Inicia sesión para responder en el hilo.
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
