export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type BadgeDefinition = {
  key: string;
  label: string;
  description: string;
  howToEarn: string;
  rarity: BadgeRarity;
  animated?: boolean;
  iconPng?: string;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'direccion-confirmada',
    label: 'Direccion Confirmada',
    description: 'Perfil con direccion de envio valida.',
    howToEarn: 'Guarda una direccion completa en tu perfil.',
    rarity: 'common',
  },
  {
    key: 'perfil-completo',
    label: 'Perfil Completo',
    description: 'Perfil optimizado al 100% para comunidad.',
    howToEarn: 'Completa nombre, avatar, banner, bio, tagline, consola y direccion.',
    rarity: 'common',
  },
  {
    key: 'foto-perfil',
    label: 'Foto de Perfil',
    description: 'Avatar personalizado cargado.',
    howToEarn: 'Sube imagen de avatar.',
    rarity: 'common',
  },
  {
    key: 'banner-personalizado',
    label: 'Banner Personalizado',
    description: 'Portada personalizada para tu perfil.',
    howToEarn: 'Sube banner o selecciona preset de banner.',
    rarity: 'rare',
  },
  {
    key: 'bio-retro',
    label: 'Bio Retro',
    description: 'Historia personal de coleccionismo visible.',
    howToEarn: 'Escribe una bio con al menos 20 caracteres.',
    rarity: 'common',
  },
  {
    key: 'cuenta-verificada',
    label: 'Cuenta Verificada',
    description: 'Cuenta aprobada para vender/operar en comunidad.',
    howToEarn: 'Recibe verificacion de vendedor o rol admin.',
    rarity: 'rare',
  },
  {
    key: 'primer-cartucho',
    label: 'Primer Cartucho',
    description: 'Primera compra completada.',
    howToEarn: 'Realiza 1 pedido pagado.',
    rarity: 'common',
  },
  {
    key: 'jugador-habitual',
    label: 'Jugador Habitual',
    description: 'Actividad de compra recurrente.',
    howToEarn: 'Realiza 5 pedidos pagados.',
    rarity: 'rare',
  },
  {
    key: 'coleccionista-oficial',
    label: 'Coleccionista Oficial',
    description: 'Coleccionista con historial consistente.',
    howToEarn: 'Realiza 10 pedidos pagados.',
    rarity: 'rare',
  },
  {
    key: 'veterano-retro',
    label: 'Veterano Retro',
    description: 'Experiencia consolidada en la tienda.',
    howToEarn: 'Realiza 25 pedidos pagados.',
    rarity: 'epic',
    animated: true,
  },
  {
    key: 'leyenda-del-pixel',
    label: 'Leyenda del Pixel',
    description: 'Uno de los compradores mas activos.',
    howToEarn: 'Realiza 50 pedidos pagados.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'maestro-del-arcade',
    label: 'Maestro del Arcade',
    description: 'Nivel maximo de fidelidad de compra.',
    howToEarn: 'Realiza 100 pedidos pagados.',
    rarity: 'mythic',
    animated: true,
  },
  {
    key: 'inversor-retro',
    label: 'Inversor Retro',
    description: 'Pedido de importe alto confirmado.',
    howToEarn: 'Haz un pedido pagado de 100 EUR o mas.',
    rarity: 'epic',
  },
  {
    key: 'buho-gamer',
    label: 'Buho Gamer',
    description: 'Compra nocturna fuera de horario.',
    howToEarn: 'Haz un pedido entre las 00:00 y las 06:00.',
    rarity: 'rare',
  },
  {
    key: 'valiente-del-misterio',
    label: 'Valiente del Misterio',
    description: 'Primera caja misteriosa comprada.',
    howToEarn: 'Compra 1 mystery box.',
    rarity: 'rare',
  },
  {
    key: 'amante-del-azar',
    label: 'Amante del Azar',
    description: 'Jugador frecuente de mystery boxes.',
    howToEarn: 'Compra 5 mystery boxes.',
    rarity: 'epic',
    animated: true,
  },
  {
    key: 'maestro-del-destino',
    label: 'Maestro del Destino',
    description: 'Especialista en mystery boxes.',
    howToEarn: 'Compra 10 mystery boxes.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'giro-inaugural',
    label: 'Giro Inaugural',
    description: 'Primera tirada de ruleta realizada.',
    howToEarn: 'Haz 1 spin en ruleta.',
    rarity: 'common',
  },
  {
    key: 'dios-del-spin',
    label: 'Dios del Spin',
    description: 'Alto volumen de tiradas acumuladas.',
    howToEarn: 'Haz 20 spins de ruleta.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'primer-vendedor',
    label: 'Primer Vendedor',
    description: 'Primera publicacion en marketplace comunidad.',
    howToEarn: 'Publica 1 anuncio de comunidad.',
    rarity: 'common',
  },
  {
    key: 'mercader-retro',
    label: 'Mercader Retro',
    description: 'Catálogo propio en crecimiento.',
    howToEarn: 'Publica 5 anuncios de comunidad.',
    rarity: 'rare',
  },
  {
    key: 'tienda-activa',
    label: 'Tienda Activa',
    description: 'Vendedor con portfolio amplio.',
    howToEarn: 'Publica 20 anuncios de comunidad.',
    rarity: 'epic',
  },
  {
    key: 'gran-comerciante',
    label: 'Gran Comerciante',
    description: 'Volumen alto de publicaciones.',
    howToEarn: 'Publica 50 anuncios de comunidad.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'venta-exitosa',
    label: 'Venta Exitosa',
    description: 'Primera venta entregada en comunidad.',
    howToEarn: 'Entrega 1 venta en marketplace comunidad.',
    rarity: 'rare',
  },
  {
    key: 'vendedor-confianza',
    label: 'Vendedor de Confianza',
    description: 'Historial fiable de ventas completadas.',
    howToEarn: 'Entrega 10 ventas en comunidad.',
    rarity: 'epic',
  },
  {
    key: 'power-seller',
    label: 'Power Seller',
    description: 'Elite de ventas de comunidad.',
    howToEarn: 'Entrega 50 ventas en comunidad.',
    rarity: 'mythic',
    animated: true,
  },
  {
    key: 'voz-retro',
    label: 'Voz Retro',
    description: 'Primera aportacion en comentarios.',
    howToEarn: 'Publica 1 comentario.',
    rarity: 'common',
  },
  {
    key: 'participante-activo',
    label: 'Participante Activo',
    description: 'Participacion regular en valoraciones.',
    howToEarn: 'Publica 10 comentarios.',
    rarity: 'rare',
  },
  {
    key: 'espiritu-comunitario',
    label: 'Espiritu Comunitario',
    description: 'Gran volumen de participacion.',
    howToEarn: 'Publica 50 comentarios.',
    rarity: 'epic',
  },
  {
    key: 'apoyo-inicial',
    label: 'Apoyo Inicial',
    description: 'Primer me gusta dado en productos.',
    howToEarn: 'Da 1 me gusta a cualquier producto.',
    rarity: 'common',
  },
  {
    key: 'fan-del-retro',
    label: 'Fan del Retro',
    description: 'Curador activo de favoritos.',
    howToEarn: 'Da 100 me gusta en productos.',
    rarity: 'epic',
  },
  {
    key: 'constante',
    label: 'Constante',
    description: 'Racha semanal de acceso.',
    howToEarn: 'Mantén 7 dias seguidos de login.',
    rarity: 'rare',
  },
  {
    key: 'comprometido',
    label: 'Comprometido',
    description: 'Racha larga de actividad.',
    howToEarn: 'Mantén 30 dias seguidos de login.',
    rarity: 'epic',
  },
  {
    key: 'adicto-al-pixel',
    label: 'Adicto al Pixel',
    description: 'Constancia extrema en la plataforma.',
    howToEarn: 'Mantén 100 dias seguidos de login.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'miembro-fundador',
    label: 'Miembro Fundador',
    description: 'Antigüedad consolidada en la comunidad.',
    howToEarn: 'Cuenta con 1 año o más de antigüedad.',
    rarity: 'rare',
  },
  {
    key: 'icono-advanced-retro',
    label: 'Icono Advanced Retro',
    description: 'Antigüedad histórica en la comunidad.',
    howToEarn: 'Cuenta con 3 años o más de antigüedad.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'hora-misteriosa',
    label: 'Hora Misteriosa',
    description: 'Insignia secreta por hora exacta.',
    howToEarn: 'Realiza un pedido a las 03:33.',
    rarity: 'mythic',
    animated: true,
  },
  {
    key: 'nintendo-vibes',
    label: 'Nintendo Vibes',
    description: 'Insignia secreta por importe exacto.',
    howToEarn: 'Realiza un pedido exacto de 64,00 EUR.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'maraton-gamer',
    label: 'Maraton Gamer',
    description: 'Insignia secreta por pedido grande.',
    howToEarn: 'Compra 3 o más productos en un mismo pedido.',
    rarity: 'epic',
  },
  {
    key: 'cliente-ejemplar',
    label: 'Cliente Ejemplar',
    description: 'Historial limpio sin cancelaciones.',
    howToEarn: 'Acumula 5 pedidos pagados y 0 cancelados.',
    rarity: 'legendary',
    animated: true,
  },
  {
    key: 'nivel-20',
    label: 'Insignia Nivel 20',
    description: 'Recompensa por progreso de nivel.',
    howToEarn: 'Alcanza el nivel 20.',
    rarity: 'epic',
  },
  {
    key: 'emblema-legendario',
    label: 'Emblema Legendario',
    description: 'Recompensa de alto nivel.',
    howToEarn: 'Alcanza el nivel 30.',
    rarity: 'legendary',
    animated: true,
  },
];

function normalizeBadgeKey(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function getBadgeIconPng(key: string): string {
  const normalized = normalizeBadgeKey(key);
  if (!normalized) return '/images/badges/default.png';
  return `/images/badges/${normalized}.png`;
}

export const BADGE_DEFINITIONS_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((badge) => [
    badge.key,
    {
      ...badge,
      iconPng: badge.iconPng || getBadgeIconPng(badge.key),
    },
  ])
);

export const ALL_BADGE_KEYS: string[] = BADGE_DEFINITIONS.map((badge) => badge.key);

export const BADGE_RARITY_ORDER: Record<BadgeRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

export const BADGE_RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Comun',
  rare: 'Rara',
  epic: 'Epica',
  legendary: 'Legendaria',
  mythic: 'Mitica',
};

export const BADGE_RARITY_STYLES: Record<
  BadgeRarity,
  {
    chipClass: string;
    panelClass: string;
    glowClass: string;
  }
> = {
  common: {
    chipClass: 'border-slate-300/40 bg-slate-200/5 text-slate-100',
    panelClass: 'border-slate-300/25 bg-slate-900/35',
    glowClass: '',
  },
  rare: {
    chipClass: 'border-cyan-300/55 bg-cyan-400/10 text-cyan-100',
    panelClass: 'border-cyan-300/30 bg-cyan-500/10',
    glowClass: '',
  },
  epic: {
    chipClass: 'border-fuchsia-300/55 bg-fuchsia-500/12 text-fuchsia-100',
    panelClass: 'border-fuchsia-300/35 bg-fuchsia-500/12',
    glowClass: '',
  },
  legendary: {
    chipClass: 'border-amber-300/60 bg-amber-500/14 text-amber-100',
    panelClass: 'border-amber-300/35 bg-amber-500/10',
    glowClass: 'shadow-[0_0_22px_rgba(251,191,36,0.25)]',
  },
  mythic: {
    chipClass:
      'border-rose-300/65 bg-[linear-gradient(120deg,rgba(244,63,94,0.22),rgba(34,211,238,0.18))] text-rose-50',
    panelClass:
      'border-rose-300/40 bg-[linear-gradient(145deg,rgba(244,63,94,0.16),rgba(34,211,238,0.1))]',
    glowClass: 'shadow-[0_0_28px_rgba(244,63,94,0.32)]',
  },
};

export function normalizeBadgeKeys(input: unknown): string[] {
  const base = Array.isArray(input)
    ? input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return [...new Set(base)];
}

export function getBadgeDefinition(key: string): BadgeDefinition | null {
  const normalized = normalizeBadgeKey(key);
  if (!normalized) return null;
  return BADGE_DEFINITIONS_MAP[normalized] || null;
}
