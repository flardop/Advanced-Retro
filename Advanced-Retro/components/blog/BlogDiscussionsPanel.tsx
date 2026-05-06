'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BLOG_DISCUSSION_GENERAL_SLUG,
  isBlogDiscussionGeneralSlug,
  listBlogDiscussionTargets,
} from '@/lib/blogDiscussionChannels';
import type { BlogDiscussionPreview, BlogDiscussionSort } from '@/lib/blogDiscussionTypes';

type BlogDiscussionsPanelProps = {
  blogSlug?: string;
  blogTitle?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  showComposer?: boolean;
};

type DiscussionsResponse = {
  discussions?: BlogDiscussionPreview[];
  canCreate?: boolean;
  error?: string;
};

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

function trimText(value: string, max = 180) {
  const clean = String(value || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}...`;
}

function isStarterEditorialPersona(userId: string) {
  return String(userId || '').startsWith('starter-editorial:');
}

export default function BlogDiscussionsPanel({
  blogSlug,
  blogTitle,
  title = 'Debates del blog',
  subtitle = 'Crea hilos, comparte opinión y sigue conversaciones de la comunidad retro.',
  limit = 8,
  showComposer = true,
}: BlogDiscussionsPanelProps) {
  const router = useRouter();
  const [sort, setSort] = useState<BlogDiscussionSort>('top');
  const [discussions, setDiscussions] = useState<BlogDiscussionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(blogSlug || BLOG_DISCUSSION_GENERAL_SLUG);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [creating, setCreating] = useState(false);
  const discussionTargets = useMemo(() => listBlogDiscussionTargets(), []);

  useEffect(() => {
    if (blogSlug) setSelectedSlug(blogSlug);
  }, [blogSlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('sort', sort);
    params.set('limit', String(limit));
    if (blogSlug) params.set('slug', blogSlug);

    const load = async () => {
      try {
        const res = await fetch(`/api/blog/discussions?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = (await res.json().catch(() => null)) as DiscussionsResponse | null;
        if (cancelled) return;
        setDiscussions(Array.isArray(data?.discussions) ? data.discussions : []);
        setCanCreate(Boolean(data?.canCreate));
      } catch {
        if (cancelled) return;
        setDiscussions([]);
        setCanCreate(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [blogSlug, limit, sort]);

  const resolvedBlogTitle = useMemo(() => {
    if (blogTitle) return blogTitle;
    const target = discussionTargets.find((item) => item.slug === blogSlug);
    return target?.title || 'este espacio';
  }, [blogSlug, blogTitle, discussionTargets]);

  const submitDiscussion = async () => {
    const safeSlug = String(blogSlug || selectedSlug || '').trim();
    const safeTitle = draftTitle.trim();
    const safeBody = draftBody.trim();

    if (!safeSlug) {
      toast.error('Selecciona primero un artículo');
      return;
    }
    if (safeTitle.length < 4) {
      toast.error('El título necesita al menos 4 caracteres');
      return;
    }
    if (safeBody.length < 20) {
      toast.error('La discusión necesita algo más de contexto');
      return;
    }
    if (creating) return;

    setCreating(true);
    try {
      const res = await fetch('/api/blog/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogSlug: safeSlug,
          title: safeTitle,
          content: safeBody,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) setCanCreate(false);
        throw new Error(data?.error || 'No se pudo crear la discusión');
      }

      const discussionId = String(data?.discussion?.id || '').trim();
      if (!discussionId) throw new Error('La discusión se creó, pero no se pudo abrir');

      setDraftTitle('');
      setDraftBody('');
      toast.success('Discusión publicada');
      router.push(`/blog/discusiones/${encodeURIComponent(discussionId)}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear la discusión');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="glass p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Debate comunitario</p>
          <h2 className="title-display text-2xl sm:text-3xl">{title}</h2>
          <p className="text-sm sm:text-base text-textMuted leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-[rgba(10,20,34,0.46)] p-1">
          <button
            type="button"
            onClick={() => setSort('top')}
            className={
              sort === 'top'
                ? 'button-primary !px-4 !py-2 text-xs'
                : 'button-secondary !px-4 !py-2 text-xs'
            }
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setSort('new')}
            className={
              sort === 'new'
                ? 'button-primary !px-4 !py-2 text-xs'
                : 'button-secondary !px-4 !py-2 text-xs'
            }
          >
            Nuevas
          </button>
        </div>
      </div>

      {showComposer ? (
        loading ? (
          <div className="rounded-[28px] border border-line bg-[rgba(7,15,26,0.72)] p-4 sm:p-5 space-y-3 animate-pulse">
            <div className="h-5 w-52 rounded-full bg-white/10" />
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-12 rounded-2xl bg-white/5" />
            <div className="h-32 rounded-[24px] bg-white/5" />
          </div>
        ) : canCreate ? (
          <div className="rounded-[28px] border border-line bg-[rgba(7,15,26,0.72)] p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="title-display text-xl">
                {blogSlug
                  ? `Abre un debate sobre ${resolvedBlogTitle}`
                  : 'Abre una discusión nueva'}
              </h3>
              <p className="text-sm text-textMuted">
                Lanza preguntas, comparte experiencias de compra, autenticidad, precios,
                coleccionismo o temas libres de la comunidad.
              </p>
            </div>

            {!blogSlug ? (
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-primary">
                  Artículo del blog
                </span>
                <select
                  value={selectedSlug}
                  onChange={(event) => setSelectedSlug(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-[rgba(8,16,28,0.74)] px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
                >
                  {discussionTargets.map((target) => (
                    <option key={target.slug} value={target.slug}>
                      {target.type === 'general'
                        ? `${target.title} · tema libre`
                        : target.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-primary">Título</span>
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Ej. ¿Cómo detectáis una repro bien hecha antes de comprar?"
                maxLength={160}
                className="w-full rounded-2xl border border-line bg-[rgba(8,16,28,0.74)] px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-primary">
                Tu mensaje
              </span>
              <textarea
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                placeholder="Explica tu caso, duda o punto de vista para que la discusión tenga contexto útil."
                rows={5}
                maxLength={3000}
                className="w-full rounded-[24px] border border-line bg-[rgba(8,16,28,0.74)] px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-textMuted">{draftBody.trim().length}/3000 caracteres</p>
              <button
                type="button"
                onClick={submitDiscussion}
                className="button-primary"
                disabled={creating}
              >
                {creating ? 'Publicando...' : 'Publicar discusión'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-line p-5 sm:p-6 bg-[rgba(8,16,28,0.42)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 max-w-xl">
              <p className="text-lg font-semibold">Inicia sesión para abrir debates</p>
              <p className="text-sm text-textMuted">
                Así cada hilo queda vinculado a un perfil real y las respuestas mantienen
                contexto dentro del blog.
              </p>
            </div>
            <Link href="/login" className="button-secondary">
              Acceder
            </Link>
          </div>
        )
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: Math.min(limit, 3) }).map((_, index) => (
              <div
                key={`blog-discussion-skeleton-${index}`}
                className="rounded-[24px] border border-line p-5 bg-[rgba(8,16,28,0.42)] animate-pulse space-y-3"
              >
                <div className="h-3 w-28 rounded-full bg-white/10" />
                <div className="h-5 w-3/4 rounded-full bg-white/10" />
                <div className="h-4 w-full rounded-full bg-white/10" />
                <div className="h-4 w-2/3 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : discussions.length > 0 ? (
          <div className="grid gap-3">
            {discussions.map((discussion) => (
              <article
                key={discussion.id}
                className="rounded-[24px] border border-line bg-[rgba(8,16,28,0.5)] p-4 sm:p-5 transition hover:border-primary/60 hover:shadow-[0_18px_42px_rgba(4,12,24,0.28)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
                      <span className="chip">{discussion.blogTitle}</span>
                      {isBlogDiscussionGeneralSlug(discussion.blogSlug) ? (
                        <span className="chip">Libre</span>
                      ) : null}
                      <span>{relativeDate(discussion.createdAt)}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="title-display text-xl leading-tight">{discussion.title}</h3>
                      <p className="text-sm text-textMuted leading-relaxed">
                        {trimText(discussion.body, 220)}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] text-sm font-semibold text-primary">
                    {avatarFallback(discussion.authorName)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-textMuted">
                    <span>{discussion.authorName}</span>
                    {isStarterEditorialPersona(discussion.userId) ? (
                      <>
                        <span>•</span>
                        <span className="chip border-cyan-400/30 bg-cyan-400/10 text-cyan-100">Starter AR</span>
                      </>
                    ) : null}
                    <span>•</span>
                    <span>{discussion.score} votos</span>
                    <span>•</span>
                    <span>{discussion.commentsCount} respuestas</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!blogSlug && !isBlogDiscussionGeneralSlug(discussion.blogSlug) ? (
                      <Link
                        href={`/blog/${discussion.blogSlug}`}
                        className="button-secondary !px-4 !py-2 text-xs sm:text-sm"
                      >
                        Ver artículo
                      </Link>
                    ) : null}
                    <Link
                      href={`/blog/discusiones/${discussion.id}`}
                      className="button-primary !px-4 !py-2 text-xs sm:text-sm"
                    >
                      Entrar al hilo
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line p-6 text-sm text-textMuted bg-[rgba(8,16,28,0.34)]">
            Aún no hay debates abiertos {blogSlug ? 'sobre este artículo' : 'en el blog'}. El
            primero puede salir de aquí.
          </div>
        )}
      </div>
    </div>
  );
}
