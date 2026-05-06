import { randomUUID } from 'node:crypto';
import type {
  RetroStorageAuctionActionType,
  RetroStorageAuctionBid,
  RetroStorageAuctionChatMessage,
  RetroStorageAuctionDetail,
  RetroStorageAuctionHint,
  RetroStorageAuctionInterest,
  RetroStorageAuctionListItem,
  RetroStorageAuctionReport,
  RetroStorageAuctionRevealItem,
  RetroStorageAuctionRuntimeState,
  RetroStorageAuctionSeed,
  RetroStorageAuctionStatus,
} from '@/lib/retroStorageAuctionTypes';
import { ensureSocialBucket } from '@/lib/productSocialStorage';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const AUCTION_BUCKET = 'product-social';
const AUCTION_PREFIX = 'auctions/retro-storage';
const MAX_BIDS = 250;
const MAX_CHAT_MESSAGES = 360;
const MAX_INTERESTS = 180;
const MAX_REPORTS = 180;
const QUICK_REACTIONS = ['🔥', '👀', '💙', '🕹️', '💎'] as const;

declare global {
  // eslint-disable-next-line no-var
  var __ADVANCED_RETRO_AUCTIONS_STATE__: Map<string, RetroStorageAuctionRuntimeState> | undefined;
}

function getMemoryStore() {
  if (!globalThis.__ADVANCED_RETRO_AUCTIONS_STATE__) {
    globalThis.__ADVANCED_RETRO_AUCTIONS_STATE__ = new Map<string, RetroStorageAuctionRuntimeState>();
  }
  return globalThis.__ADVANCED_RETRO_AUCTIONS_STATE__;
}

function auctionStatePath(slug: string) {
  return `${AUCTION_PREFIX}/${slug}.json`;
}

function clampCurrency(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric));
}

function safeText(value: unknown, max = 140): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeAuthorName(value: unknown): string {
  const cleaned = safeText(value, 60);
  return cleaned || 'Coleccionista';
}

function safeUserId(value: unknown): string {
  return safeText(value, 120);
}

function safeAvatarUrl(value: unknown): string | null {
  const cleaned = safeText(value, 500);
  if (!cleaned) return null;
  if (!/^https?:\/\//i.test(cleaned) && !cleaned.startsWith('/')) return null;
  return cleaned;
}

function safeIsoDate(value: unknown, fallback = new Date().toISOString()): string {
  const cleaned = safeText(value, 80);
  if (!cleaned) return fallback;
  const timestamp = new Date(cleaned).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

function safeHint(raw: any): RetroStorageAuctionHint | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = safeText(raw.title, 80);
  const detail = safeText(raw.detail, 220);
  if (!title || !detail) return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    title,
    detail,
  };
}

function safeRevealItem(raw: any): RetroStorageAuctionRevealItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const label = safeText(raw.label, 120);
  const itemType = safeText(raw.itemType, 20);
  const condition = safeText(raw.condition, 80);
  if (!label || !condition) return null;
  if (!['console', 'game', 'accessory', 'collectible', 'document'].includes(itemType)) return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    label,
    itemType: itemType as RetroStorageAuctionRevealItem['itemType'],
    condition,
    estimatedValueCents: clampCurrency(raw.estimatedValueCents),
    verified: Boolean(raw.verified),
    marketplaceReady: Boolean(raw.marketplaceReady),
  };
}

function safeBid(raw: any): RetroStorageAuctionBid | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = safeUserId(raw.userId);
  const authorName = safeAuthorName(raw.authorName);
  const amountCents = clampCurrency(raw.amountCents);
  if (!userId || amountCents <= 0) return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    userId,
    authorName,
    authorAvatarUrl: safeAvatarUrl(raw.authorAvatarUrl),
    amountCents,
    createdAt: safeIsoDate(raw.createdAt),
  };
}

function safeChatMessage(raw: any): RetroStorageAuctionChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = safeUserId(raw.userId);
  const authorName = safeAuthorName(raw.authorName);
  const body = safeText(raw.body, 420);
  const kind = safeText(raw.kind, 20);
  if (!userId || !authorName || !body) return null;
  if (kind !== 'message' && kind !== 'reaction') return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    userId,
    authorName,
    authorAvatarUrl: safeAvatarUrl(raw.authorAvatarUrl),
    body,
    kind,
    createdAt: safeIsoDate(raw.createdAt),
  };
}

function safeInterest(raw: any): RetroStorageAuctionInterest | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = safeUserId(raw.userId);
  const authorName = safeAuthorName(raw.authorName);
  const action = safeText(raw.action, 10);
  if (!userId || !authorName) return null;
  if (action !== 'buy' && action !== 'rent') return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    userId,
    authorName,
    action,
    createdAt: safeIsoDate(raw.createdAt),
  };
}

function safeReport(raw: any): RetroStorageAuctionReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = safeUserId(raw.userId);
  const authorName = safeAuthorName(raw.authorName);
  const messageId = safeText(raw.messageId, 80);
  const reason = safeText(raw.reason, 220);
  if (!userId || !messageId || !reason) return null;
  return {
    id: safeText(raw.id, 80) || randomUUID(),
    messageId,
    userId,
    authorName,
    reason,
    createdAt: safeIsoDate(raw.createdAt),
  };
}

function sortByCreatedAtAsc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function sortBidsDesc(items: RetroStorageAuctionBid[]): RetroStorageAuctionBid[] {
  return [...items].sort((a, b) => {
    if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function defaultState(seed: RetroStorageAuctionSeed): RetroStorageAuctionRuntimeState {
  return {
    bids: sortByCreatedAtAsc(seed.seedBids).slice(-MAX_BIDS),
    chat: sortByCreatedAtAsc(seed.seedChat).slice(-MAX_CHAT_MESSAGES),
    reminderUserIds: [],
    interests: [],
    reports: [],
    extendedUntil: null,
    revealedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeState(raw: any, seed: RetroStorageAuctionSeed): RetroStorageAuctionRuntimeState {
  const base = defaultState(seed);
  if (!raw || typeof raw !== 'object') return base;
  const bids = Array.isArray(raw.bids)
    ? raw.bids.map((item: any) => safeBid(item)).filter((item: RetroStorageAuctionBid | null): item is RetroStorageAuctionBid => Boolean(item))
    : base.bids;
  const chat = Array.isArray(raw.chat)
    ? raw.chat
        .map((item: any) => safeChatMessage(item))
        .filter((item: RetroStorageAuctionChatMessage | null): item is RetroStorageAuctionChatMessage => Boolean(item))
    : base.chat;
  const interests = Array.isArray(raw.interests)
    ? raw.interests
        .map((item: any) => safeInterest(item))
        .filter((item: RetroStorageAuctionInterest | null): item is RetroStorageAuctionInterest => Boolean(item))
    : [];
  const reports = Array.isArray(raw.reports)
    ? raw.reports
        .map((item: any) => safeReport(item))
        .filter((item: RetroStorageAuctionReport | null): item is RetroStorageAuctionReport => Boolean(item))
    : [];
  const reminderUserIds = Array.isArray(raw.reminderUserIds)
    ? raw.reminderUserIds.map((item: unknown) => safeUserId(item)).filter(Boolean)
    : [];

  return {
    bids: sortByCreatedAtAsc<RetroStorageAuctionBid>(bids).slice(-MAX_BIDS),
    chat: sortByCreatedAtAsc<RetroStorageAuctionChatMessage>(chat).slice(-MAX_CHAT_MESSAGES),
    reminderUserIds,
    interests: sortByCreatedAtAsc<RetroStorageAuctionInterest>(interests).slice(-MAX_INTERESTS),
    reports: sortByCreatedAtAsc<RetroStorageAuctionReport>(reports).slice(-MAX_REPORTS),
    extendedUntil: raw.extendedUntil ? safeIsoDate(raw.extendedUntil) : null,
    revealedAt: raw.revealedAt ? safeIsoDate(raw.revealedAt) : null,
    updatedAt: safeIsoDate(raw.updatedAt),
  };
}

function sumEstimatedValue(items: RetroStorageAuctionRevealItem[]) {
  return items.reduce((total, item) => total + clampCurrency(item.estimatedValueCents), 0);
}

const SEEDS: RetroStorageAuctionSeed[] = [
  {
    slug: 'vault-kanto-07',
    title: 'Vault Kanto 07',
    subtitle: 'Lote sellado con sesgo Pokemon + Game Boy Color',
    teaser:
      'Almacen curado por Advanced Retro con contenido minimo garantizado y documentacion interna verificada.',
    category: 'Pokemon / Game Boy',
    warehouseCode: 'AR-VLT-07',
    rarityLabel: 'Rareza alta',
    image: '/images/auctions/vault-kanto-07.svg',
    previewMode: 'blur',
    startsAt: '2026-04-18T09:30:00.000Z',
    endsAt: '2026-04-19T21:00:00.000Z',
    startingBidCents: 19500,
    minIncrementCents: 1000,
    extensionWindowSeconds: 120,
    extensionBySeconds: 90,
    guaranteedMinimum: 'Minimo 1 juego Pokemon autentico + 1 accesorio Game Boy documentado',
    minimumEstimatedValueCents: 32000,
    verificationChecklist: [
      'Fotos interiores y exteriores archivadas por Advanced Retro',
      'Piezas con procedencia registrada antes de la subasta',
      'Contenido minimo garantizado visible en las condiciones del lote',
    ],
    hints: [
      { id: 'hint-kanto-1', title: 'Pista 01', detail: 'Incluye al menos una pieza Pokemon de quinta columna de coleccion.' },
      { id: 'hint-kanto-2', title: 'Pista 02', detail: 'Hay un cartucho con shell no gris dentro del lote.' },
      { id: 'hint-kanto-3', title: 'Pista 03', detail: 'Una de las piezas esta preparada para publicarse en el marketplace sin restauracion extra.' },
    ],
    transparencyNote:
      'El contenido no es azar puro: existe inventario verificado y documentado. La subasta cubre un lote fisico real custodiado por Advanced Retro.',
    legalNote:
      'La compra corresponde a un lote verificado con contenido minimo garantizado. No se usa lenguaje ni mecanicas de apuesta.',
    rentFeeCentsPerMonth: 1200,
    rentGraceDays: 7,
    modes: ['auction', 'rent'],
    revealedContents: [
      { id: 'rv-kanto-1', label: 'Pokemon Edicion Amarilla', itemType: 'game', condition: 'Muy bueno', estimatedValueCents: 16500, verified: true, marketplaceReady: true },
      { id: 'rv-kanto-2', label: 'Carcasa GBC translucida violeta', itemType: 'accessory', condition: 'Excelente', estimatedValueCents: 4800, verified: true, marketplaceReady: true },
      { id: 'rv-kanto-3', label: 'Manual parcial Pokemon Stadium promo', itemType: 'document', condition: 'Bueno', estimatedValueCents: 3200, verified: true, marketplaceReady: false },
      { id: 'rv-kanto-4', label: 'Insert protector coleccionista', itemType: 'collectible', condition: 'Excelente', estimatedValueCents: 2100, verified: true, marketplaceReady: true },
    ],
    seedBids: [
      { id: 'bid-kanto-1', userId: 'seed-user-1', authorName: 'ArcadeHunter', authorAvatarUrl: null, amountCents: 19500, createdAt: '2026-04-18T09:35:00.000Z' },
      { id: 'bid-kanto-2', userId: 'seed-user-2', authorName: 'PixelMika', authorAvatarUrl: null, amountCents: 20500, createdAt: '2026-04-18T10:02:00.000Z' },
      { id: 'bid-kanto-3', userId: 'seed-user-3', authorName: 'VaultRider', authorAvatarUrl: null, amountCents: 22500, createdAt: '2026-04-18T10:17:00.000Z' },
    ],
    seedChat: [
      { id: 'chat-kanto-1', userId: 'seed-user-1', authorName: 'ArcadeHunter', authorAvatarUrl: null, body: 'Esa pista del shell me tiene dentro.', kind: 'message', createdAt: '2026-04-18T10:03:00.000Z' },
      { id: 'chat-kanto-2', userId: 'seed-user-4', authorName: 'RetroLuna', authorAvatarUrl: null, body: '👀', kind: 'reaction', createdAt: '2026-04-18T10:05:00.000Z' },
    ],
  },
  {
    slug: 'arcade-dreamcast-locker',
    title: 'Arcade Dreamcast Locker',
    subtitle: 'Lote social con hardware SEGA y extras de cabina domestica',
    teaser: 'Unidad orientada a coleccionistas de Dreamcast con mezcla de hardware, perifero y material de apoyo.',
    category: 'SEGA / Dreamcast',
    warehouseCode: 'AR-DRM-11',
    rarityLabel: 'Curado de evento',
    image: '/images/auctions/arcade-dreamcast-locker.svg',
    previewMode: 'partial',
    startsAt: '2026-04-18T13:00:00.000Z',
    endsAt: '2026-04-20T20:30:00.000Z',
    startingBidCents: 26000,
    minIncrementCents: 1500,
    extensionWindowSeconds: 180,
    extensionBySeconds: 120,
    guaranteedMinimum: 'Minimo 1 hardware SEGA funcional + 2 piezas accesorias verificadas',
    minimumEstimatedValueCents: 45000,
    verificationChecklist: [
      'Registro audiovisual del lote antes de sellado',
      'Checklist interno firmado por el equipo de verificacion',
      'Minimo garantizado visible antes de pujar',
    ],
    hints: [
      { id: 'hint-dc-1', title: 'Pista 01', detail: 'Hay una pieza blanca de sobremesa y un accesorio ligado a juego competitivo.' },
      { id: 'hint-dc-2', title: 'Pista 02', detail: 'Una de las referencias tiene potencial directo para reventa premium.' },
      { id: 'hint-dc-3', title: 'Pista 03', detail: 'Valor estimado superior al minimo garantizado si se vende por separado.' },
    ],
    transparencyNote: 'Todas las piezas han sido fotografiadas y catalogadas antes del sellado. El ocultamiento es parcial, no aleatorio.',
    legalNote: 'Subasta de lote documentado y no juego de azar. Se informa contenido minimo garantizado y custodia previa.',
    rentFeeCentsPerMonth: 1800,
    rentGraceDays: 10,
    modes: ['auction', 'buy', 'rent'],
    revealedContents: [
      { id: 'rv-dc-1', label: 'Dreamcast PAL revisada', itemType: 'console', condition: 'Muy bueno', estimatedValueCents: 21000, verified: true, marketplaceReady: true },
      { id: 'rv-dc-2', label: 'VMU transparente', itemType: 'accessory', condition: 'Bueno', estimatedValueCents: 4800, verified: true, marketplaceReady: true },
      { id: 'rv-dc-3', label: 'Shenmue discos sueltos', itemType: 'game', condition: 'Bueno', estimatedValueCents: 8600, verified: true, marketplaceReady: false },
      { id: 'rv-dc-4', label: 'Tarjeta de notas de revision interna', itemType: 'document', condition: 'Archivo', estimatedValueCents: 1200, verified: true, marketplaceReady: false },
    ],
    seedBids: [
      { id: 'bid-dc-1', userId: 'seed-user-5', authorName: 'SaturnKid', authorAvatarUrl: null, amountCents: 26000, createdAt: '2026-04-18T13:03:00.000Z' },
      { id: 'bid-dc-2', userId: 'seed-user-6', authorName: 'DreamPort', authorAvatarUrl: null, amountCents: 27500, createdAt: '2026-04-18T13:10:00.000Z' },
    ],
    seedChat: [
      { id: 'chat-dc-1', userId: 'seed-user-7', authorName: 'BlueVMU', authorAvatarUrl: null, body: 'Si hay VMU me quedo hasta el final.', kind: 'message', createdAt: '2026-04-18T13:22:00.000Z' },
      { id: 'chat-dc-2', userId: 'seed-user-6', authorName: 'DreamPort', authorAvatarUrl: null, body: '🔥', kind: 'reaction', createdAt: '2026-04-18T13:24:00.000Z' },
    ],
  },
  {
    slug: 'museum-nes-container',
    title: 'Museum NES Container',
    subtitle: 'Contenedor documentado con hardware Nintendo 8-bit',
    teaser: 'Lote de perfil museistico con minimo garantizado y posibilidad de compra directa tras subasta.',
    category: 'NES / Nintendo',
    warehouseCode: 'AR-NES-03',
    rarityLabel: 'Archivo de coleccion',
    image: '/images/auctions/museum-nes-container.svg',
    previewMode: 'partial',
    startsAt: '2026-04-21T18:00:00.000Z',
    endsAt: '2026-04-22T21:00:00.000Z',
    startingBidCents: 31000,
    minIncrementCents: 1500,
    extensionWindowSeconds: 180,
    extensionBySeconds: 120,
    guaranteedMinimum: 'Minimo 1 hardware NES + 1 cartucho first-party + material de soporte',
    minimumEstimatedValueCents: 52000,
    verificationChecklist: [
      'Documentacion fotogrametrica del lote antes de publicar',
      'Apertura grabada disponible para auditoria interna',
      'Condicion del hardware testada en taller',
    ],
    hints: [
      { id: 'hint-nes-1', title: 'Pista 01', detail: 'Hay frontal gris claro y botoneria clasica en el lote.' },
      { id: 'hint-nes-2', title: 'Pista 02', detail: 'Una pieza first-party puede salir a mercado individual con margen.' },
    ],
    transparencyNote: 'Se publica solo lo suficiente para preservar sorpresa sin ocultar el minimo garantizado ni la verificabilidad.',
    legalNote: 'Compra de lote con inventario fisico identificado. Nada se genera por azar durante la puja.',
    rentFeeCentsPerMonth: 1400,
    rentGraceDays: 6,
    modes: ['auction', 'buy'],
    revealedContents: [
      { id: 'rv-nes-1', label: 'NES revisada y limpia', itemType: 'console', condition: 'Muy bueno', estimatedValueCents: 26000, verified: true, marketplaceReady: true },
      { id: 'rv-nes-2', label: 'Cartucho Super Mario Bros.', itemType: 'game', condition: 'Bueno', estimatedValueCents: 7800, verified: true, marketplaceReady: true },
      { id: 'rv-nes-3', label: 'Manual de mantenimiento original', itemType: 'document', condition: 'Bueno', estimatedValueCents: 2400, verified: true, marketplaceReady: false },
    ],
    seedBids: [],
    seedChat: [
      { id: 'chat-nes-1', userId: 'seed-user-8', authorName: 'Famicase', authorAvatarUrl: null, body: 'Ya tengo el recordatorio guardado.', kind: 'message', createdAt: '2026-04-18T11:14:00.000Z' },
    ],
  },
  {
    slug: 'gba-service-crate',
    title: 'GBA Service Crate',
    subtitle: 'Caja finalizada con handheld y repuestos premium',
    teaser: 'Lote ya resuelto para mostrar la apertura publica y el valor obtenido dentro de Advanced Retro.',
    category: 'Game Boy Advance',
    warehouseCode: 'AR-GBA-21',
    rarityLabel: 'Apertura publica',
    image: '/images/auctions/gba-service-crate.svg',
    previewMode: 'clear',
    startsAt: '2026-04-15T19:00:00.000Z',
    endsAt: '2026-04-17T20:00:00.000Z',
    startingBidCents: 22000,
    minIncrementCents: 1000,
    extensionWindowSeconds: 120,
    extensionBySeconds: 90,
    guaranteedMinimum: 'Minimo 1 consola GBA + 2 piezas de soporte verificadas',
    minimumEstimatedValueCents: 36000,
    verificationChecklist: [
      'Apertura ya registrada y lista para mostrar',
      'Todas las piezas contrastadas con base interna',
      'Winner ready para marketplace tras cierre',
    ],
    hints: [
      { id: 'hint-gba-1', title: 'Pista 01', detail: 'Este lote ya esta resuelto y sirve como referencia de transparencia.' },
    ],
    transparencyNote: 'Lote usado como ejemplo de apertura y trazabilidad para enseñar el proceso completo.',
    legalNote: 'Ejemplo finalizado de lote real documentado, sin mecánicas de apuesta.',
    rentFeeCentsPerMonth: null,
    rentGraceDays: null,
    modes: ['auction'],
    revealedContents: [
      { id: 'rv-gba-1', label: 'Game Boy Advance SP plata', itemType: 'console', condition: 'Muy bueno', estimatedValueCents: 14500, verified: true, marketplaceReady: true },
      { id: 'rv-gba-2', label: 'Cartucho GBA shell gris premium', itemType: 'game', condition: 'Bueno', estimatedValueCents: 6200, verified: true, marketplaceReady: true },
      { id: 'rv-gba-3', label: 'Lote de protectores y repuestos', itemType: 'accessory', condition: 'Excelente', estimatedValueCents: 5100, verified: true, marketplaceReady: true },
      { id: 'rv-gba-4', label: 'Ficha de verificacion de taller', itemType: 'document', condition: 'Archivo', estimatedValueCents: 700, verified: true, marketplaceReady: false },
    ],
    seedBids: [
      { id: 'bid-gba-1', userId: 'seed-user-9', authorName: 'PocketWave', authorAvatarUrl: null, amountCents: 22000, createdAt: '2026-04-15T19:10:00.000Z' },
      { id: 'bid-gba-2', userId: 'seed-user-10', authorName: 'HandheldClub', authorAvatarUrl: null, amountCents: 25000, createdAt: '2026-04-16T18:17:00.000Z' },
      { id: 'bid-gba-3', userId: 'seed-user-11', authorName: 'NeoPalm', authorAvatarUrl: null, amountCents: 27000, createdAt: '2026-04-17T19:58:00.000Z' },
    ],
    seedChat: [
      { id: 'chat-gba-1', userId: 'seed-user-11', authorName: 'NeoPalm', authorAvatarUrl: null, body: 'Se ha ido a extension en el ultimo minuto.', kind: 'message', createdAt: '2026-04-17T19:59:00.000Z' },
    ],
  },
];

export function getRetroStorageAuctionSeeds(): RetroStorageAuctionSeed[] {
  return SEEDS;
}

export function getRetroStorageAuctionSeed(slug: string): RetroStorageAuctionSeed | null {
  const safeSlug = safeText(slug, 160).toLowerCase();
  return SEEDS.find((seed) => seed.slug === safeSlug) || null;
}

export function hasRetroStorageAuctionSeed(slug: string): boolean {
  return Boolean(getRetroStorageAuctionSeed(slug));
}

async function readStoredState(slug: string, seed: RetroStorageAuctionSeed): Promise<RetroStorageAuctionRuntimeState> {
  if (!supabaseAdmin) {
    const store = getMemoryStore();
    return store.get(slug) || defaultState(seed);
  }

  const { data, error } = await supabaseAdmin.storage.from(AUCTION_BUCKET).download(auctionStatePath(slug));
  if (error || !data) return defaultState(seed);

  try {
    const raw = JSON.parse(await data.text());
    return sanitizeState(raw, seed);
  } catch {
    return defaultState(seed);
  }
}

async function writeStoredState(slug: string, seed: RetroStorageAuctionSeed, state: RetroStorageAuctionRuntimeState) {
  const safeState = sanitizeState(
    {
      ...state,
      updatedAt: new Date().toISOString(),
    },
    seed
  );

  if (!supabaseAdmin) {
    const store = getMemoryStore();
    store.set(slug, safeState);
    return;
  }

  await ensureSocialBucket();
  const { error } = await supabaseAdmin.storage
    .from(AUCTION_BUCKET)
    .upload(auctionStatePath(slug), Buffer.from(JSON.stringify(safeState), 'utf8'), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });
  if (error) {
    throw new Error(`No se pudo guardar el estado de subasta: ${error.message}`);
  }
}

function getEffectiveEndsAt(seed: RetroStorageAuctionSeed, state: RetroStorageAuctionRuntimeState): string {
  const base = new Date(seed.endsAt).getTime();
  const extended = state.extendedUntil ? new Date(state.extendedUntil).getTime() : 0;
  const timestamp = Math.max(base, extended || 0);
  return new Date(timestamp).toISOString();
}

function getStatus(seed: RetroStorageAuctionSeed, state: RetroStorageAuctionRuntimeState, now = Date.now()): RetroStorageAuctionStatus {
  const startsAt = new Date(seed.startsAt).getTime();
  const effectiveEndsAt = new Date(getEffectiveEndsAt(seed, state)).getTime();
  if (now < startsAt) return 'upcoming';
  if (now < effectiveEndsAt) return 'live';
  return 'ended';
}

function getLeader(bids: RetroStorageAuctionBid[]): RetroStorageAuctionBid | null {
  return sortBidsDesc(bids)[0] || null;
}

function getCurrentBidCents(seed: RetroStorageAuctionSeed, state: RetroStorageAuctionRuntimeState): number {
  const leader = getLeader(state.bids);
  return leader ? leader.amountCents : seed.startingBidCents;
}

function getNextBidCents(seed: RetroStorageAuctionSeed, state: RetroStorageAuctionRuntimeState): number {
  return getCurrentBidCents(seed, state) + seed.minIncrementCents;
}

function countInterests(
  state: RetroStorageAuctionRuntimeState
): { buyRequestsCount: number; rentRequestsCount: number } {
  return state.interests.reduce(
    (acc, item) => {
      if (item.action === 'buy') acc.buyRequestsCount += 1;
      if (item.action === 'rent') acc.rentRequestsCount += 1;
      return acc;
    },
    { buyRequestsCount: 0, rentRequestsCount: 0 }
  );
}

function toListItem(
  seed: RetroStorageAuctionSeed,
  state: RetroStorageAuctionRuntimeState,
  currentUserId?: string | null
): RetroStorageAuctionListItem {
  const leader = getLeader(state.bids);
  const { buyRequestsCount, rentRequestsCount } = countInterests(state);
  const effectiveEndsAt = getEffectiveEndsAt(seed, state);
  return {
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    teaser: seed.teaser,
    category: seed.category,
    warehouseCode: seed.warehouseCode,
    rarityLabel: seed.rarityLabel,
    image: seed.image,
    previewMode: seed.previewMode,
    status: getStatus(seed, state),
    startsAt: seed.startsAt,
    endsAt: seed.endsAt,
    effectiveEndsAt,
    currentBidCents: getCurrentBidCents(seed, state),
    nextBidCents: getNextBidCents(seed, state),
    bidsCount: state.bids.length,
    leaderName: leader?.authorName || null,
    remindersCount: state.reminderUserIds.length,
    buyRequestsCount,
    rentRequestsCount,
    isReminderActive: Boolean(currentUserId && state.reminderUserIds.includes(currentUserId)),
    guaranteedMinimum: seed.guaranteedMinimum,
    minimumEstimatedValueCents: seed.minimumEstimatedValueCents,
    isExtended: new Date(effectiveEndsAt).getTime() > new Date(seed.endsAt).getTime(),
    isRevealed: Boolean(state.revealedAt),
  };
}

function toDetail(
  seed: RetroStorageAuctionSeed,
  state: RetroStorageAuctionRuntimeState,
  currentUserId?: string | null
): RetroStorageAuctionDetail {
  const listItem = toListItem(seed, state, currentUserId);
  const leader = getLeader(state.bids);
  return {
    ...listItem,
    transparencyNote: seed.transparencyNote,
    legalNote: seed.legalNote,
    minIncrementCents: seed.minIncrementCents,
    extensionWindowSeconds: seed.extensionWindowSeconds,
    extensionBySeconds: seed.extensionBySeconds,
    verificationChecklist: seed.verificationChecklist,
    hints: seed.hints,
    modes: seed.modes,
    rentFeeCentsPerMonth: seed.rentFeeCentsPerMonth,
    rentGraceDays: seed.rentGraceDays,
    bids: sortBidsDesc(state.bids),
    chat: sortByCreatedAtAsc(state.chat),
    revealedContents: state.revealedAt ? seed.revealedContents : [],
    reportsCount: state.reports.length,
    isAuthenticated: Boolean(currentUserId),
    currentUserId: currentUserId || null,
    canBid: listItem.status === 'live',
    canReveal: listItem.status === 'ended' && !state.revealedAt,
    winnerUserId: leader?.userId || null,
    winnerName: leader?.authorName || null,
  };
}

export function getQuickAuctionReactions(): readonly string[] {
  return QUICK_REACTIONS;
}

export async function listRetroStorageAuctions(currentUserId?: string | null): Promise<RetroStorageAuctionListItem[]> {
  const entries = await Promise.all(
    SEEDS.map(async (seed) => {
      const state = await readStoredState(seed.slug, seed);
      return toListItem(seed, state, currentUserId);
    })
  );

  return entries.sort((a, b) => {
    const order = { live: 0, upcoming: 1, ended: 2 } as const;
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(a.effectiveEndsAt).getTime() - new Date(b.effectiveEndsAt).getTime();
  });
}

export async function getRetroStorageAuctionDetail(
  slug: string,
  currentUserId?: string | null
): Promise<RetroStorageAuctionDetail | null> {
  const seed = getRetroStorageAuctionSeed(slug);
  if (!seed) return null;
  const state = await readStoredState(seed.slug, seed);
  return toDetail(seed, state, currentUserId);
}

export async function placeRetroStorageBid(input: {
  slug: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  amountCents: number;
}) {
  const seed = getRetroStorageAuctionSeed(input.slug);
  if (!seed) throw new Error('La subasta indicada no existe');

  const state = await readStoredState(seed.slug, seed);
  const status = getStatus(seed, state);
  if (status !== 'live') {
    throw new Error('La subasta no esta activa para pujar');
  }

  const amountCents = clampCurrency(input.amountCents);
  const minAllowed = getNextBidCents(seed, state);
  if (amountCents < minAllowed) {
    throw new Error(`La puja minima actual es ${minAllowed}`);
  }

  const bid: RetroStorageAuctionBid = {
    id: randomUUID(),
    userId: safeUserId(input.userId),
    authorName: safeAuthorName(input.authorName),
    authorAvatarUrl: safeAvatarUrl(input.authorAvatarUrl),
    amountCents,
    createdAt: new Date().toISOString(),
  };

  state.bids = [...state.bids, bid].slice(-MAX_BIDS);
  const effectiveEndsAtMs = new Date(getEffectiveEndsAt(seed, state)).getTime();
  const nowMs = Date.now();
  const remainingMs = Math.max(0, effectiveEndsAtMs - nowMs);
  if (remainingMs <= seed.extensionWindowSeconds * 1000) {
    state.extendedUntil = new Date(effectiveEndsAtMs + seed.extensionBySeconds * 1000).toISOString();
  }

  await writeStoredState(seed.slug, seed, state);
  return getRetroStorageAuctionDetail(seed.slug, input.userId);
}

export async function postRetroStorageChatMessage(input: {
  slug: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  body: string;
  kind?: 'message' | 'reaction';
}) {
  const seed = getRetroStorageAuctionSeed(input.slug);
  if (!seed) throw new Error('La subasta indicada no existe');
  const state = await readStoredState(seed.slug, seed);
  const status = getStatus(seed, state);
  const kind = input.kind === 'reaction' ? 'reaction' : 'message';
  const body = safeText(input.body, kind === 'reaction' ? 6 : 420);
  if (!body) throw new Error('El mensaje esta vacio');
  if (status === 'ended' && !state.revealedAt) {
    throw new Error('El chat se reabrira tras el revelado final');
  }
  const message: RetroStorageAuctionChatMessage = {
    id: randomUUID(),
    userId: safeUserId(input.userId),
    authorName: safeAuthorName(input.authorName),
    authorAvatarUrl: safeAvatarUrl(input.authorAvatarUrl),
    body,
    kind,
    createdAt: new Date().toISOString(),
  };
  state.chat = [...state.chat, message].slice(-MAX_CHAT_MESSAGES);
  await writeStoredState(seed.slug, seed, state);
  return getRetroStorageAuctionDetail(seed.slug, input.userId);
}

export async function toggleRetroStorageReminder(slug: string, userId: string) {
  const seed = getRetroStorageAuctionSeed(slug);
  if (!seed) throw new Error('La subasta indicada no existe');
  const state = await readStoredState(seed.slug, seed);
  const safeId = safeUserId(userId);
  if (!safeId) throw new Error('Usuario invalido');
  if (state.reminderUserIds.includes(safeId)) {
    state.reminderUserIds = state.reminderUserIds.filter((entry) => entry !== safeId);
  } else {
    state.reminderUserIds = [...state.reminderUserIds, safeId];
  }
  await writeStoredState(seed.slug, seed, state);
  return getRetroStorageAuctionDetail(seed.slug, safeId);
}

export async function registerRetroStorageInterest(input: {
  slug: string;
  userId: string;
  authorName: string;
  action: Exclude<RetroStorageAuctionActionType, 'auction'>;
}) {
  const seed = getRetroStorageAuctionSeed(input.slug);
  if (!seed) throw new Error('La subasta indicada no existe');
  if (!seed.modes.includes(input.action)) {
    throw new Error('Este lote no admite esa modalidad');
  }
  const state = await readStoredState(seed.slug, seed);
  const safeId = safeUserId(input.userId);
  const authorName = safeAuthorName(input.authorName);
  state.interests = state.interests.filter(
    (entry) => !(entry.userId === safeId && entry.action === input.action)
  );
  state.interests.push({
    id: randomUUID(),
    userId: safeId,
    authorName,
    action: input.action,
    createdAt: new Date().toISOString(),
  });
  state.interests = state.interests.slice(-MAX_INTERESTS);
  await writeStoredState(seed.slug, seed, state);
  return getRetroStorageAuctionDetail(seed.slug, safeId);
}

export async function revealRetroStorageAuction(slug: string, currentUserId?: string | null) {
  const seed = getRetroStorageAuctionSeed(slug);
  if (!seed) throw new Error('La subasta indicada no existe');
  const state = await readStoredState(seed.slug, seed);
  const status = getStatus(seed, state);
  if (status !== 'ended') {
    throw new Error('El almacen todavia no puede abrirse');
  }
  if (!state.revealedAt) {
    state.revealedAt = new Date().toISOString();
    await writeStoredState(seed.slug, seed, state);
  }
  return getRetroStorageAuctionDetail(seed.slug, currentUserId);
}

export async function reportRetroStorageChatMessage(input: {
  slug: string;
  userId: string;
  authorName: string;
  messageId: string;
  reason: string;
}) {
  const seed = getRetroStorageAuctionSeed(input.slug);
  if (!seed) throw new Error('La subasta indicada no existe');
  const state = await readStoredState(seed.slug, seed);
  const message = state.chat.find((item) => item.id === input.messageId);
  if (!message) throw new Error('El mensaje indicado ya no existe');
  state.reports.push({
    id: randomUUID(),
    messageId: message.id,
    userId: safeUserId(input.userId),
    authorName: safeAuthorName(input.authorName),
    reason: safeText(input.reason, 220) || 'Revision solicitada',
    createdAt: new Date().toISOString(),
  });
  state.reports = state.reports.slice(-MAX_REPORTS);
  await writeStoredState(seed.slug, seed, state);
  return { ok: true, reportsCount: state.reports.length };
}

export function getAuctionLeaderboardSource(auctions: RetroStorageAuctionListItem[]) {
  const counts = new Map<string, { name: string; liveWins: number; totalBidValueCents: number }>();
  for (const auction of auctions) {
    if (!auction.leaderName) continue;
    const current = counts.get(auction.leaderName) || {
      name: auction.leaderName,
      liveWins: 0,
      totalBidValueCents: 0,
    };
    current.liveWins += 1;
    current.totalBidValueCents += auction.currentBidCents;
    counts.set(auction.leaderName, current);
  }
  return [...counts.values()].sort((a, b) => {
    if (b.liveWins !== a.liveWins) return b.liveWins - a.liveWins;
    return b.totalBidValueCents - a.totalBidValueCents;
  });
}

export function buildRetroStorageAuctionCalendarIcs(seed: RetroStorageAuctionSeed, detail: RetroStorageAuctionDetail): string {
  const starts = new Date(seed.startsAt);
  const ends = new Date(detail.effectiveEndsAt);
  const format = (value: Date) =>
    value
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  const description = [
    seed.title,
    seed.subtitle,
    `Categoria: ${seed.category}`,
    `Minimo garantizado: ${seed.guaranteedMinimum}`,
    `Lote: ${seed.warehouseCode}`,
    `Advanced Retro: https://advancedretro.es/subastas/${seed.slug}`,
  ].join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Advanced Retro//Retro Storage Auctions//ES',
    'BEGIN:VEVENT',
    `UID:${seed.slug}@advancedretro.es`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(starts)}`,
    `DTEND:${format(ends)}`,
    `SUMMARY:${seed.title}`,
    `DESCRIPTION:${description}`,
    `URL:https://advancedretro.es/subastas/${seed.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\n');
}

export function getRetroStorageAuctionBlueprintSummary() {
  return {
    totalSeeds: SEEDS.length,
    minimumGuaranteedValueCents: Math.min(...SEEDS.map((seed) => seed.minimumEstimatedValueCents)),
    maximumRevealedValueCents: Math.max(...SEEDS.map((seed) => sumEstimatedValue(seed.revealedContents))),
  };
}
