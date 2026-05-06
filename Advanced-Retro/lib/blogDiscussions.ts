import { randomUUID } from 'node:crypto';
import type {
  BlogDiscussionComment,
  BlogDiscussionPreview,
  BlogDiscussionReply,
  BlogDiscussionSort,
  BlogDiscussionThread,
} from '@/lib/blogDiscussionTypes';
import {
  BLOG_DISCUSSION_GENERAL_SLUG,
  isSupportedBlogDiscussionSlug,
  listBlogDiscussionSlugs,
  resolveBlogDiscussionTitle,
} from '@/lib/blogDiscussionChannels';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureSocialBucket } from '@/lib/productSocialStorage';

const BLOG_DISCUSSION_MAX_PER_POST = 160;
const BLOG_DISCUSSION_MAX_COMMENTS = 220;
const BLOG_DISCUSSION_MAX_REPLIES = 60;
const BLOG_SOCIAL_BUCKET = 'product-social';
const STARTER_EDITORIAL_PREFIX = 'starter-editorial:';

export type BlogDiscussion = {
  id: string;
  blogSlug: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  votesByUser: Record<string, 1 | -1>;
  comments: BlogDiscussionComment[];
};

type BlogDiscussionState = {
  discussions: BlogDiscussion[];
  updatedAt: string;
};

export type {
  BlogDiscussionComment,
  BlogDiscussionPreview,
  BlogDiscussionReply,
  BlogDiscussionSort,
  BlogDiscussionThread,
};

function discussionStatePath(slug: string) {
  return `blog/discussions/${slug}.json`;
}

function starterUserId(handle: string) {
  return `${STARTER_EDITORIAL_PREFIX}${handle}`;
}

function makeStarterReply(input: {
  id: string;
  handle: string;
  authorName: string;
  body: string;
  createdAt: string;
}): BlogDiscussionReply {
  return {
    id: input.id,
    userId: starterUserId(input.handle),
    authorName: input.authorName,
    authorAvatarUrl: null,
    body: input.body,
    createdAt: input.createdAt,
  };
}

function makeStarterComment(input: {
  id: string;
  handle: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies?: BlogDiscussionReply[];
}): BlogDiscussionComment {
  return {
    id: input.id,
    userId: starterUserId(input.handle),
    authorName: input.authorName,
    authorAvatarUrl: null,
    body: input.body,
    createdAt: input.createdAt,
    replies: input.replies || [],
  };
}

function makeStarterDiscussion(input: {
  id: string;
  blogSlug: string;
  handle: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  votesByUser?: Record<string, 1 | -1>;
  comments?: BlogDiscussionComment[];
}): BlogDiscussion {
  return {
    id: input.id,
    blogSlug: input.blogSlug,
    userId: starterUserId(input.handle),
    authorName: input.authorName,
    authorAvatarUrl: null,
    title: input.title,
    body: input.body,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt || input.createdAt,
    votesByUser: input.votesByUser || {},
    comments: input.comments || [],
  };
}

const STARTER_DISCUSSIONS: Record<string, BlogDiscussion[]> = {
  [BLOG_DISCUSSION_GENERAL_SLUG]: [
    makeStarterDiscussion({
      id: 'starter-general-kicks',
      blogSlug: BLOG_DISCUSSION_GENERAL_SLUG,
      handle: 'pixelnora',
      authorName: 'PixelNora',
      title: '¿Qué revisión de Game Boy Color os parece más fiable para empezar colección?',
      body:
        'Estoy ayudando a un amigo a arrancar colección y me interesa saber qué revisión o variante os parece mejor punto de entrada entre precio, durabilidad y facilidad para completar accesorios originales.',
      createdAt: '2026-04-19T19:40:00.000Z',
      votesByUser: {
        [starterUserId('marta-pocket')]: 1,
        [starterUserId('hexa-cart')]: 1,
      },
      comments: [
        makeStarterComment({
          id: 'starter-general-kicks-c1',
          handle: 'marta-pocket',
          authorName: 'MartaPocket',
          body:
            'Para entrar sin sufrir demasiado, GBC estándar. Tiene recambio, variedad de shell y no te obliga a irte a ediciones locas desde el día uno.',
          createdAt: '2026-04-19T20:02:00.000Z',
          replies: [
            makeStarterReply({
              id: 'starter-general-kicks-c1-r1',
              handle: 'vault-raul',
              authorName: 'VaultRaul',
              body:
                'Coincido. Si además quieres exposición bonita, una transparente violeta te da look de colección sin disparar presupuesto.',
              createdAt: '2026-04-19T20:16:00.000Z',
            }),
          ],
        }),
        makeStarterComment({
          id: 'starter-general-kicks-c2',
          handle: 'hexa-cart',
          authorName: 'HexaCart',
          body:
            'Si el objetivo es jugar mucho y no solo vitrina, también miraría GBA clásica. Menos purista, pero muy disfrutable como consola real de uso.',
          createdAt: '2026-04-19T20:19:00.000Z',
        }),
      ],
    }),
    makeStarterDiscussion({
      id: 'starter-general-weekly',
      blogSlug: BLOG_DISCUSSION_GENERAL_SLUG,
      handle: 'arcade-clara',
      authorName: 'ArcadeClara',
      title: 'Hilo semanal de cazas retro: ¿qué pieza habéis visto esta semana y os ha tentado?',
      body:
        'Abro hilo para compartir hallazgos, dudas de precio y compras que os han hecho parar dos veces antes de pagar. Puede servir para contrastar si algo estaba bien de precio o no.',
      createdAt: '2026-04-20T10:05:00.000Z',
      votesByUser: {
        [starterUserId('pixelnora')]: 1,
        [starterUserId('marta-pocket')]: 1,
      },
      comments: [
        makeStarterComment({
          id: 'starter-general-weekly-c1',
          handle: 'retro-ivan',
          authorName: 'RetroIvan',
          body:
            'He visto un pack SNES con caja muy decente pero manual flojo. Justo el tipo de lote donde el precio parece bueno hasta que descuentas lo que te faltará arreglar.',
          createdAt: '2026-04-20T10:34:00.000Z',
        }),
      ],
    }),
  ],
  'como-valorar-juego-retro-original-vs-repro': [
    makeStarterDiscussion({
      id: 'starter-repro-checklist',
      blogSlug: 'como-valorar-juego-retro-original-vs-repro',
      handle: 'ana-labelscan',
      authorName: 'AnaLabelScan',
      title: 'Mi orden de comprobación cuando una repro está muy bien hecha',
      body:
        'Normalmente empiezo por materiales, luego por etiqueta y solo después pido interior. Si desde fuera ya hay dos señales raras, casi siempre el interior confirma sospechas. ¿Vosotros seguís un orden parecido o vais directos a PCB?',
      createdAt: '2026-04-18T17:22:00.000Z',
      votesByUser: {
        [starterUserId('hexa-cart')]: 1,
      },
      comments: [
        makeStarterComment({
          id: 'starter-repro-checklist-c1',
          handle: 'hexa-cart',
          authorName: 'HexaCart',
          body:
            'Yo también empiezo por fuera. En fotos malas prefiero pedir macro de tornillo y lomo antes de pedir apertura. Ahí ya se cae mucha pieza dudosa.',
          createdAt: '2026-04-18T17:45:00.000Z',
        }),
      ],
    }),
  ],
  'guia-completar-juego-caja-manual-insert-protector': [
    makeStarterDiscussion({
      id: 'starter-complete-order',
      blogSlug: 'guia-completar-juego-caja-manual-insert-protector',
      handle: 'luna-inserts',
      authorName: 'LunaInserts',
      title: '¿Vosotros compráis primero caja o manual cuando queréis cerrar un completo?',
      body:
        'Yo suelo bloquear caja primero porque es lo que más se me cruza por estado, pero cada vez veo más gente priorizando manual para no acabar con cajas bonitas imposibles de completar a corto plazo.',
      createdAt: '2026-04-17T21:12:00.000Z',
      votesByUser: {
        [starterUserId('arcade-clara')]: 1,
        [starterUserId('vault-raul')]: 1,
      },
      comments: [
        makeStarterComment({
          id: 'starter-complete-order-c1',
          handle: 'vault-raul',
          authorName: 'VaultRaul',
          body:
            'Caja primero si el título es difícil. Manual primero solo si ya tienes una caja aceptable fichada y sabes que caerá pronto.',
          createdAt: '2026-04-17T21:30:00.000Z',
        }),
      ],
    }),
  ],
  'precio-retro-mercado-evitar-sobrepago': [
    makeStarterDiscussion({
      id: 'starter-market-range',
      blogSlug: 'precio-retro-mercado-evitar-sobrepago',
      handle: 'market-caro',
      authorName: 'MarketCaro',
      title: 'Cómo decido si un precio alto sigue siendo razonable',
      body:
        'Mi regla rápida: si el estado está por encima de lo habitual y la pieza no aparece cada semana, no comparo con el mínimo del mercado, comparo con el rango alto real. El problema es que mucha gente mira solo un anuncio barato y se queda ahí.',
      createdAt: '2026-04-16T18:08:00.000Z',
      votesByUser: {
        [starterUserId('ana-labelscan')]: 1,
      },
      comments: [
        makeStarterComment({
          id: 'starter-market-range-c1',
          handle: 'marta-pocket',
          authorName: 'MartaPocket',
          body:
            'Tal cual. Si la pieza está limpia, completa y no tiene desgaste raro, pagar rango alto puede estar perfectamente justificado.',
          createdAt: '2026-04-16T18:21:00.000Z',
        }),
      ],
    }),
  ],
};

function getStarterDiscussionsForSlug(slug: string): BlogDiscussion[] {
  return (STARTER_DISCUSSIONS[slug] || []).map((discussion) => ({
    ...discussion,
    comments: (discussion.comments || []).map((comment) => ({
      ...comment,
      replies: [...(comment.replies || [])],
    })),
  }));
}

function mergeStarterDiscussions(blogSlug: string, discussions: BlogDiscussion[]): BlogDiscussion[] {
  const merged = new Map<string, BlogDiscussion>();
  for (const starter of getStarterDiscussionsForSlug(blogSlug)) {
    merged.set(starter.id, starter);
  }
  for (const discussion of discussions) {
    merged.set(discussion.id, discussion);
  }
  return [...merged.values()]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, BLOG_DISCUSSION_MAX_PER_POST);
}

function defaultState(blogSlug?: string): BlogDiscussionState {
  return {
    discussions: blogSlug ? getStarterDiscussionsForSlug(blogSlug) : [],
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeAvatarUrl(raw: unknown): string | null {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return null;
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) return null;
  return value.slice(0, 500);
}

function sanitizeUserId(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().slice(0, 80) : '';
}

function sanitizeAuthorName(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value ? value.slice(0, 60) : 'Coleccionista';
}

function sanitizeReply(raw: any): BlogDiscussionReply | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = sanitizeUserId(raw.userId);
  const body = typeof raw.body === 'string' ? raw.body.trim().slice(0, 1200) : '';
  if (!userId || body.length < 2) return null;

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    userId,
    authorName: sanitizeAuthorName(raw.authorName),
    authorAvatarUrl: sanitizeAvatarUrl(raw.authorAvatarUrl),
    body,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt.trim()
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

function sanitizeComment(raw: any): BlogDiscussionComment | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = sanitizeUserId(raw.userId);
  const body = typeof raw.body === 'string' ? raw.body.trim().slice(0, 1800) : '';
  if (!userId || body.length < 2) return null;

  const replies = Array.isArray(raw.replies)
    ? raw.replies
        .map((item: any) => sanitizeReply(item))
        .filter((item: BlogDiscussionReply | null): item is BlogDiscussionReply => Boolean(item))
        .sort(
          (a: BlogDiscussionReply, b: BlogDiscussionReply) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, BLOG_DISCUSSION_MAX_REPLIES)
    : [];

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    userId,
    authorName: sanitizeAuthorName(raw.authorName),
    authorAvatarUrl: sanitizeAvatarUrl(raw.authorAvatarUrl),
    body,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt.trim()
        ? raw.createdAt
        : new Date().toISOString(),
    replies,
  };
}

function sanitizeVotesByUser(raw: unknown): Record<string, 1 | -1> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => {
        const userId = sanitizeUserId(key);
        const numeric = Number(value);
        if (!userId || (numeric !== 1 && numeric !== -1)) return [null, null];
        return [userId, numeric as 1 | -1];
      })
      .filter(([key, value]) => Boolean(key) && (value === 1 || value === -1))
  ) as Record<string, 1 | -1>;
}

function sanitizeDiscussion(raw: any, forcedSlug?: string): BlogDiscussion | null {
  if (!raw || typeof raw !== 'object') return null;
  const blogSlug = String(forcedSlug || raw.blogSlug || '').trim().toLowerCase();
  if (!blogSlug || !isSupportedBlogDiscussionSlug(blogSlug)) return null;

  const userId = sanitizeUserId(raw.userId);
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 160) : '';
  const body = typeof raw.body === 'string' ? raw.body.trim().slice(0, 3000) : '';
  if (!userId || title.length < 4 || body.length < 10) return null;

  const comments = Array.isArray(raw.comments)
    ? raw.comments
        .map((item: any) => sanitizeComment(item))
        .filter((item: BlogDiscussionComment | null): item is BlogDiscussionComment => Boolean(item))
        .sort(
          (a: BlogDiscussionComment, b: BlogDiscussionComment) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, BLOG_DISCUSSION_MAX_COMMENTS)
    : [];

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    blogSlug,
    userId,
    authorName: sanitizeAuthorName(raw.authorName),
    authorAvatarUrl: sanitizeAvatarUrl(raw.authorAvatarUrl),
    title,
    body,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt.trim()
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
        ? raw.updatedAt
        : new Date().toISOString(),
    votesByUser: sanitizeVotesByUser(raw.votesByUser),
    comments,
  };
}

function sanitizeState(raw: any, slug: string): BlogDiscussionState {
  const safe = defaultState(slug);
  if (!raw || typeof raw !== 'object') return safe;

  const discussions = Array.isArray(raw.discussions) ? raw.discussions : [];
  const sanitizedDiscussions = discussions
    .map((item: any) => sanitizeDiscussion(item, slug))
    .filter((item: BlogDiscussion | null): item is BlogDiscussion => Boolean(item));
  safe.discussions = mergeStarterDiscussions(slug, sanitizedDiscussions);
  safe.updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
      ? raw.updatedAt
      : new Date().toISOString();
  return safe;
}

function scoreDiscussion(input: Pick<BlogDiscussion, 'votesByUser'>): number {
  return Object.values(input.votesByUser || {}).reduce((total, value) => total + Number(value || 0), 0);
}

function commentsCountForDiscussion(input: Pick<BlogDiscussion, 'comments'>): number {
  return (input.comments || []).reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0);
}

function toPreview(input: BlogDiscussion, currentUserId?: string | null): BlogDiscussionPreview {
  const currentVote =
    currentUserId && input.votesByUser[currentUserId]
      ? input.votesByUser[currentUserId]
      : 0;

  return {
    id: input.id,
    blogSlug: input.blogSlug,
    blogTitle: resolveBlogDiscussionTitle(input.blogSlug),
    authorName: input.authorName,
    authorAvatarUrl: input.authorAvatarUrl,
    userId: input.userId,
    title: input.title,
    body: input.body,
    score: scoreDiscussion(input),
    commentsCount: commentsCountForDiscussion(input),
    currentUserVote: currentVote as -1 | 0 | 1,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

function toThread(input: BlogDiscussion, currentUserId?: string | null): BlogDiscussionThread {
  return {
    ...toPreview(input, currentUserId),
    comments: input.comments,
  };
}

function sortPreviews(previews: BlogDiscussionPreview[], sort: BlogDiscussionSort): BlogDiscussionPreview[] {
  return [...previews].sort((a, b) => {
    if (sort === 'new') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (b.score !== a.score) return b.score - a.score;
    if (b.commentsCount !== a.commentsCount) return b.commentsCount - a.commentsCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function readBlogDiscussionState(blogSlug: string): Promise<BlogDiscussionState> {
  if (!supabaseAdmin) return defaultState();

  const safeSlug = String(blogSlug || '').trim().toLowerCase();
  if (!safeSlug || !isSupportedBlogDiscussionSlug(safeSlug)) return defaultState(safeSlug);

  const { data, error } = await supabaseAdmin.storage.from(BLOG_SOCIAL_BUCKET).download(discussionStatePath(safeSlug));
  if (error || !data) return defaultState(safeSlug);

  try {
    const raw = JSON.parse(await data.text());
    return sanitizeState(raw, safeSlug);
  } catch {
    return defaultState(safeSlug);
  }
}

export async function writeBlogDiscussionState(blogSlug: string, state: BlogDiscussionState): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase no está configurado');
  const safeSlug = String(blogSlug || '').trim().toLowerCase();
  if (!safeSlug || !isSupportedBlogDiscussionSlug(safeSlug)) {
    throw new Error('Canal de discusión no válido');
  }

  await ensureSocialBucket();

  const payload = {
    ...sanitizeState(state, safeSlug),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.storage
    .from(BLOG_SOCIAL_BUCKET)
    .upload(discussionStatePath(safeSlug), Buffer.from(JSON.stringify(payload), 'utf8'), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });

  if (error) {
    throw new Error(`Error guardando discusiones del blog: ${error.message}`);
  }
}

export async function listBlogDiscussions(options?: {
  blogSlug?: string | null;
  currentUserId?: string | null;
  sort?: BlogDiscussionSort;
  limit?: number;
}): Promise<BlogDiscussionPreview[]> {
  const safeSlug = String(options?.blogSlug || '').trim().toLowerCase();
  const slugs = safeSlug
    ? isSupportedBlogDiscussionSlug(safeSlug)
      ? [safeSlug]
      : []
    : listBlogDiscussionSlugs();

  const states = await Promise.all(slugs.map((slug) => readBlogDiscussionState(slug)));
  const previews = states.flatMap((state) =>
    state.discussions.map((discussion) => toPreview(discussion, options?.currentUserId))
  );

  return sortPreviews(previews, options?.sort || 'top').slice(0, Math.max(1, Math.min(60, Number(options?.limit || 12))));
}

export async function getBlogDiscussionById(
  discussionId: string,
  currentUserId?: string | null
): Promise<BlogDiscussionThread | null> {
  const safeId = String(discussionId || '').trim();
  if (!safeId) return null;

  for (const slug of listBlogDiscussionSlugs()) {
    const state = await readBlogDiscussionState(slug);
    const discussion = state.discussions.find((item) => item.id === safeId);
    if (discussion) return toThread(discussion, currentUserId);
  }

  return null;
}

export async function createBlogDiscussion(input: {
  blogSlug: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  title: string;
  body: string;
}): Promise<BlogDiscussionThread> {
  const blogSlug = String(input.blogSlug || '').trim().toLowerCase();
  if (!isSupportedBlogDiscussionSlug(blogSlug)) throw new Error('Canal de discusión no válido');

  const title = String(input.title || '').trim().slice(0, 160);
  const body = String(input.body || '').trim().slice(0, 3000);
  if (title.length < 4) throw new Error('El título debe tener al menos 4 caracteres');
  if (body.length < 20) throw new Error('El contenido debe tener al menos 20 caracteres');

  const state = await readBlogDiscussionState(blogSlug);
  const now = new Date().toISOString();

  const next: BlogDiscussion = {
    id: randomUUID(),
    blogSlug,
    userId: sanitizeUserId(input.userId),
    authorName: sanitizeAuthorName(input.authorName),
    authorAvatarUrl: sanitizeAvatarUrl(input.authorAvatarUrl),
    title,
    body,
    createdAt: now,
    updatedAt: now,
    votesByUser: {},
    comments: [],
  };

  state.discussions.unshift(next);
  state.discussions = state.discussions.slice(0, BLOG_DISCUSSION_MAX_PER_POST);
  state.updatedAt = now;
  await writeBlogDiscussionState(blogSlug, state);

  return toThread(next, input.userId);
}

export async function addBlogDiscussionComment(input: {
  discussionId: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  body: string;
  parentCommentId?: string | null;
}): Promise<BlogDiscussionThread> {
  const safeDiscussionId = String(input.discussionId || '').trim();
  const safeParentId = String(input.parentCommentId || '').trim();
  const body = String(input.body || '').trim().slice(0, safeParentId ? 1200 : 1800);

  if (!safeDiscussionId) throw new Error('Discusión no válida');
  if (body.length < 2) throw new Error('El comentario debe tener al menos 2 caracteres');

  for (const slug of listBlogDiscussionSlugs()) {
    const state = await readBlogDiscussionState(slug);
    const discussion = state.discussions.find((item) => item.id === safeDiscussionId);
    if (!discussion) continue;

    const now = new Date().toISOString();

    if (safeParentId) {
      const parent = discussion.comments.find((comment) => comment.id === safeParentId);
      if (!parent) throw new Error('No se encontró el comentario al que responder');

      parent.replies.push({
        id: randomUUID(),
        userId: sanitizeUserId(input.userId),
        authorName: sanitizeAuthorName(input.authorName),
        authorAvatarUrl: sanitizeAvatarUrl(input.authorAvatarUrl),
        body,
        createdAt: now,
      });
      parent.replies = parent.replies.slice(-BLOG_DISCUSSION_MAX_REPLIES);
    } else {
      discussion.comments.push({
        id: randomUUID(),
        userId: sanitizeUserId(input.userId),
        authorName: sanitizeAuthorName(input.authorName),
        authorAvatarUrl: sanitizeAvatarUrl(input.authorAvatarUrl),
        body,
        createdAt: now,
        replies: [],
      });
      discussion.comments = discussion.comments.slice(-BLOG_DISCUSSION_MAX_COMMENTS);
    }

    discussion.updatedAt = now;
    state.updatedAt = now;
    await writeBlogDiscussionState(slug, state);
    return toThread(discussion, input.userId);
  }

  throw new Error('No se encontró la discusión');
}

export async function setBlogDiscussionVote(input: {
  discussionId: string;
  userId: string;
  value: -1 | 0 | 1;
}): Promise<BlogDiscussionThread> {
  const safeDiscussionId = String(input.discussionId || '').trim();
  const safeUserId = sanitizeUserId(input.userId);
  if (!safeDiscussionId || !safeUserId) throw new Error('No se pudo registrar el voto');

  for (const slug of listBlogDiscussionSlugs()) {
    const state = await readBlogDiscussionState(slug);
    const discussion = state.discussions.find((item) => item.id === safeDiscussionId);
    if (!discussion) continue;

    if (input.value === 0) {
      delete discussion.votesByUser[safeUserId];
    } else {
      discussion.votesByUser[safeUserId] = input.value;
    }
    discussion.updatedAt = new Date().toISOString();
    state.updatedAt = discussion.updatedAt;
    await writeBlogDiscussionState(slug, state);
    return toThread(discussion, safeUserId);
  }

  throw new Error('No se encontró la discusión');
}
