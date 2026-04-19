'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { isBlogDiscussionGeneralSlug } from '@/lib/blogDiscussionChannels';
import type { BlogDiscussionThread } from '@/lib/blogDiscussionTypes';

type BlogDiscussionThreadViewProps = {
  discussionId: string;
  initialDiscussion?: BlogDiscussionThread | null;
};

type DiscussionResponse = {
  discussion?: BlogDiscussionThread;
  currentUserId?: string | null;
  canComment?: boolean;
  error?: string;
};

type ReplyDraftMap = Record<string, string>;
type ReplyOpenMap = Record<string, boolean>;

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

export default function BlogDiscussionThreadView({
  discussionId,
  initialDiscussion,
}: BlogDiscussionThreadViewProps) {
  const [discussion, setDiscussion] = useState<BlogDiscussionThread | null>(
    initialDiscussion || null
  );
  const [loading, setLoading] = useState(!initialDiscussion);
  const [authResolved, setAuthResolved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyOpen, setReplyOpen] = useState<ReplyOpenMap>({});
  const [replyDrafts, setReplyDrafts] = useState<ReplyDraftMap>({});
  const [sendingReplyFor, setSendingReplyFor] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const loadDiscussion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/discussions/${encodeURIComponent(discussionId)}`, {
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as DiscussionResponse | null;
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo cargar el hilo');
      }
      setDiscussion(data?.discussion || null);
      setCurrentUserId(
        typeof data?.currentUserId === 'string' && data.currentUserId.trim()
          ? data.currentUserId
          : null
      );
      setCanComment(Boolean(data?.canComment));
    } catch (error: any) {
      setCanComment(false);
      toast.error(error?.message || 'No se pudo cargar la discusión');
    } finally {
      setLoading(false);
      setAuthResolved(true);
    }
  }, [discussionId]);

  useEffect(() => {
    void loadDiscussion();
  }, [loadDiscussion]);

  const commentsCount = useMemo(() => {
    if (!discussion) return 0;
    return discussion.comments.reduce(
      (total, comment) => total + 1 + (comment.replies?.length || 0),
      0
    );
  }, [discussion]);

  const submitVote = async (value: 1 | -1) => {
    if (!discussion) return;
    if (!currentUserId) {
      toast.error('Inicia sesión para votar en discusiones');
      return;
    }
    if (voting) return;

    const nextValue = discussion.currentUserVote === value ? 0 : value;
    setVoting(true);
    try {
      const res = await fetch(`/api/blog/discussions/${encodeURIComponent(discussion.id)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: nextValue }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo registrar el voto');
      setDiscussion(data?.discussion || null);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar el voto');
    } finally {
      setVoting(false);
    }
  };

  const submitComment = async (parentCommentId?: string) => {
    if (!discussion) return;
    const safeParentId = String(parentCommentId || '').trim();
    const value = safeParentId
      ? String(replyDrafts[safeParentId] || '').trim()
      : commentDraft.trim();

    if (value.length < 2) {
      toast.error(safeParentId ? 'La respuesta es demasiado corta' : 'El comentario es demasiado corto');
      return;
    }
    if (value.length > (safeParentId ? 1200 : 1800)) {
      toast.error(safeParentId ? 'La respuesta es demasiado larga' : 'El comentario es demasiado largo');
      return;
    }
    if (safeParentId ? Boolean(sendingReplyFor) : sendingComment) return;

    if (safeParentId) {
      setSendingReplyFor(safeParentId);
    } else {
      setSendingComment(true);
    }

    try {
      const res = await fetch(
        `/api/blog/discussions/${encodeURIComponent(discussion.id)}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: value,
            parentCommentId: safeParentId || null,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) setCanComment(false);
        throw new Error(data?.error || 'No se pudo publicar el comentario');
      }

      setDiscussion(data?.discussion || null);
      if (safeParentId) {
        setReplyDrafts((prev) => ({ ...prev, [safeParentId]: '' }));
        setReplyOpen((prev) => ({ ...prev, [safeParentId]: false }));
      } else {
        setCommentDraft('');
      }
      toast.success(safeParentId ? 'Respuesta publicada' : 'Comentario publicado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo publicar el comentario');
    } finally {
      setSendingReplyFor(null);
      setSendingComment(false);
    }
  };

  if (loading && !discussion) {
    return (
      <div className="glass p-6 sm:p-8 space-y-5 animate-pulse">
        <div className="h-4 w-32 rounded-full bg-white/10" />
        <div className="h-9 w-3/4 rounded-full bg-white/10" />
        <div className="h-4 w-full rounded-full bg-white/10" />
        <div className="h-4 w-5/6 rounded-full bg-white/10" />
        <div className="h-40 rounded-[28px] bg-white/5" />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="glass p-6 sm:p-8 space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Discusión</p>
        <h1 className="title-display text-3xl">No hemos encontrado este hilo</h1>
        <p className="text-textMuted">
          Puede que se haya borrado o que el enlace esté incompleto. Desde el blog puedes abrir
          uno nuevo o volver al artículo original.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/blog" className="button-secondary">
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex shrink-0 gap-3 lg:flex-col">
            <button
              type="button"
              onClick={() => submitVote(1)}
              disabled={voting || !authResolved}
              className={
                discussion.currentUserVote === 1
                  ? 'button-primary !h-12 !w-12 !rounded-2xl !px-0 !py-0'
                  : 'button-secondary !h-12 !w-12 !rounded-2xl !px-0 !py-0'
              }
              aria-label="Votar positivo"
            >
              ▲
            </button>
            <div className="flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] text-lg font-semibold text-text">
              {discussion.score}
            </div>
            <button
              type="button"
              onClick={() => submitVote(-1)}
              disabled={voting || !authResolved}
              className={
                discussion.currentUserVote === -1
                  ? 'button-primary !h-12 !w-12 !rounded-2xl !px-0 !py-0'
                  : 'button-secondary !h-12 !w-12 !rounded-2xl !px-0 !py-0'
              }
              aria-label="Votar negativo"
            >
              ▼
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
              <span className="chip">{discussion.blogTitle}</span>
              {isBlogDiscussionGeneralSlug(discussion.blogSlug) ? (
                <span className="chip">Tema libre</span>
              ) : null}
              <span>{relativeDate(discussion.createdAt)}</span>
              <span>•</span>
              <span>{commentsCount} respuestas</span>
            </div>

            <div className="space-y-3">
              <h1 className="title-display text-3xl sm:text-4xl leading-tight">
                {discussion.title}
              </h1>
              <p className="text-textMuted leading-relaxed whitespace-pre-line">
                {discussion.body}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-line bg-[rgba(8,16,28,0.38)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] text-sm font-semibold text-primary">
                  {avatarFallback(discussion.authorName)}
                </div>
                <div>
                  <p className="font-semibold">{discussion.authorName}</p>
                  <p className="text-xs text-textMuted">Autor del hilo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isBlogDiscussionGeneralSlug(discussion.blogSlug) ? (
                  <Link
                    href={`/blog/${discussion.blogSlug}`}
                    className="button-secondary !px-4 !py-2 text-xs sm:text-sm"
                  >
                    Ver artículo
                  </Link>
                ) : null}
                <Link href="/blog" className="button-secondary !px-4 !py-2 text-xs sm:text-sm">
                  Más debates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass p-5 sm:p-7 space-y-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Respuestas</p>
          <h2 className="title-display text-2xl sm:text-3xl">La conversación</h2>
          <p className="text-sm text-textMuted">
            Aquí la comunidad puede contrastar autenticidad, precios, repros y cualquier detalle
            del coleccionismo retro.
          </p>
        </div>

        {!authResolved ? (
          <div className="rounded-[28px] border border-line bg-[rgba(8,16,28,0.46)] p-4 sm:p-5 space-y-3 animate-pulse">
            <div className="h-4 w-40 rounded-full bg-white/10" />
            <div className="h-28 rounded-[24px] bg-white/5" />
            <div className="flex justify-between gap-3">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-10 w-36 rounded-full bg-white/10" />
            </div>
          </div>
        ) : canComment ? (
          <div className="rounded-[28px] border border-line bg-[rgba(8,16,28,0.46)] p-4 sm:p-5 space-y-3">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-primary">
                Añadir comentario
              </span>
              <textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                rows={4}
                maxLength={1800}
                placeholder="Aporta algo útil: contexto, experiencia real, dudas o una respuesta clara."
                className="w-full rounded-[24px] border border-line bg-[rgba(8,16,28,0.74)] px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-textMuted">{commentDraft.trim().length}/1800 caracteres</p>
              <button
                type="button"
                onClick={() => submitComment()}
                className="button-primary"
                disabled={sendingComment}
              >
                {sendingComment ? 'Publicando...' : 'Publicar comentario'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line p-5 bg-[rgba(8,16,28,0.36)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 max-w-xl">
              <p className="font-semibold">Inicia sesión para participar</p>
              <p className="text-sm text-textMuted">
                Así las opiniones quedan firmadas y el hilo conserva continuidad entre respuestas.
              </p>
            </div>
            <Link href="/login" className="button-secondary">
              Acceder
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {discussion.comments.length > 0 ? (
            discussion.comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-[26px] border border-line bg-[rgba(8,16,28,0.42)] p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] text-sm font-semibold text-primary">
                      {avatarFallback(comment.authorName)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{comment.authorName}</p>
                        {comment.userId === discussion.userId ? (
                          <span className="chip">OP</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-textMuted">{relativeDate(comment.createdAt)}</p>
                    </div>
                  </div>

                  {canComment ? (
                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpen((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                      }
                      className="button-secondary !px-4 !py-2 text-xs"
                    >
                      {replyOpen[comment.id] ? 'Cerrar' : 'Responder'}
                    </button>
                  ) : null}
                </div>

                <p className="text-sm sm:text-base text-textMuted leading-relaxed whitespace-pre-line">
                  {comment.body}
                </p>

                {replyOpen[comment.id] ? (
                  <div className="rounded-[22px] border border-line bg-[rgba(255,255,255,0.03)] p-4 space-y-3">
                    <textarea
                      value={replyDrafts[comment.id] || ''}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [comment.id]: event.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={1200}
                      placeholder="Responde con algo útil para el hilo."
                      className="w-full rounded-[20px] border border-line bg-[rgba(8,16,28,0.74)] px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-textMuted">
                        {String(replyDrafts[comment.id] || '').trim().length}/1200 caracteres
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setReplyOpen((prev) => ({ ...prev, [comment.id]: false }))
                          }
                          className="button-secondary !px-4 !py-2 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => submitComment(comment.id)}
                          className="button-primary !px-4 !py-2 text-xs"
                          disabled={sendingReplyFor === comment.id}
                        >
                          {sendingReplyFor === comment.id ? 'Enviando...' : 'Responder'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {comment.replies?.length ? (
                  <div className="space-y-3 border-l border-line/80 pl-4 sm:pl-5">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-[20px] border border-line bg-[rgba(255,255,255,0.03)] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-[rgba(255,255,255,0.04)] text-xs font-semibold text-primary">
                            {avatarFallback(reply.authorName)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{reply.authorName}</p>
                              {reply.userId === discussion.userId ? (
                                <span className="chip">OP</span>
                              ) : null}
                              <span className="text-xs text-textMuted">
                                {relativeDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-textMuted leading-relaxed whitespace-pre-line">
                              {reply.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-line p-6 bg-[rgba(8,16,28,0.3)] text-sm text-textMuted">
              Aún no hay respuestas en este hilo. Si tienes experiencia real, este es buen momento
              para arrancar la conversación.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
