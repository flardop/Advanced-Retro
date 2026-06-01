import { MEMBERSHIP_PLANS } from '@/lib/membership';
import { getProductHref } from '@/lib/productUrl';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { formatKnowledgeTopic, getAssistantKnowledge } from '@/lib/assistant/knowledgeBase';
import type { AssistantUserContext } from '@/lib/assistant/userContext';

export type AssistantLocale = 'es' | 'en';
export type AssistantRole = 'user' | 'assistant';
export type AssistantProvider = 'local';

export type AssistantMessage = {
  role: AssistantRole;
  content: string;
};

export type AssistantLink = {
  label: string;
  href: string;
};

export type AssistantProductHint = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  href: string;
  category?: 'accessory' | 'collectible' | 'game' | 'console' | 'unknown';
};

export type AssistantResponsePayload = {
  provider: AssistantProvider;
  message: string;
  content: string;
  links: AssistantLink[];
  productMatches: AssistantProductHint[];
};

type AssistantIntent =
  | 'greeting'
  | 'mystery'
  | 'retroville'
  | 'gift'
  | 'order'
  | 'shipping'
  | 'returns'
  | 'login'
  | 'auction'
  | 'memberships'
  | 'creator'
  | 'stores'
  | 'contact'
  | 'community'
  | 'support'
  | 'product-search'
  | 'fallback';

type ConversationFacts = {
  budget: number | null;
  platform: string | null;
  style: 'safe' | 'special' | null;
  wantsBundle: boolean;
  wantsPersonalized: boolean;
};

const PRODUCT_QUERY_GENERIC_WORDS = new Set([
  'hola',
  'buenas',
  'ayuda',
  'precio',
  'envio',
  'envío',
  'shipping',
  'tracking',
  'pedido',
  'ticket',
  'ruleta',
  'roulette',
  'mystery',
  'subasta',
  'auction',
  'login',
  'sesion',
  'sesión',
  'retroville',
  'recomiendame',
  'recomiéndame',
  'recomendame',
  'recomendar',
]);

const PLATFORM_KEYWORDS: Array<{ label: string; patterns: string[] }> = [
  { label: 'Game Boy', patterns: ['game boy', 'gameboy', 'gb'] },
  { label: 'Game Boy Color', patterns: ['game boy color', 'gameboy color', 'gbc'] },
  { label: 'Game Boy Advance', patterns: ['game boy advance', 'gameboy advance', 'gba'] },
  { label: 'Nintendo DS', patterns: ['nintendo ds', 'nds', 'ds'] },
  { label: 'Nintendo 3DS', patterns: ['3ds', 'nintendo 3ds'] },
  { label: 'Super Nintendo', patterns: ['super nintendo', 'snes'] },
  { label: 'Nintendo 64', patterns: ['nintendo 64', 'n64'] },
  { label: 'GameCube', patterns: ['gamecube', 'game cube'] },
  { label: 'Nintendo Switch', patterns: ['switch', 'nintendo switch'] },
  { label: 'PlayStation', patterns: ['playstation', 'ps1', 'ps2', 'ps3', 'ps4', 'ps5'] },
  { label: 'Xbox', patterns: ['xbox', 'series x', 'series s', 'x360'] },
  { label: 'Pokémon', patterns: ['pokemon', 'pokémon'] },
];

const FRANCHISE_RULES = [
  'pokemon',
  'pokémon',
  'zelda',
  'mario',
  'kirby',
  'metroid',
  'sonic',
  'donkey kong',
  'final fantasy',
  'resident evil',
  'dragon ball',
  'castlevania',
];

export function normalizeLocale(input: unknown): AssistantLocale {
  const raw = String(input || 'es').trim().toLowerCase();
  return raw.startsWith('en') ? 'en' : 'es';
}

export function normalizeMessages(input: unknown, maxLength = 12): AssistantMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const role = String((item as Record<string, unknown>)?.role || '').trim();
      const content = String((item as Record<string, unknown>)?.content || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1800);
      if ((role !== 'user' && role !== 'assistant') || !content) return null;
      return { role: role as AssistantRole, content };
    })
    .filter((item): item is AssistantMessage => Boolean(item))
    .slice(-maxLength);
}

function buildProductQuery(userText: string): string {
  return userText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function parseBudget(text: string): number | null {
  const normalized = text.toLowerCase();
  const direct = normalized.match(/(\d{1,4})(?:[.,](\d{1,2}))?\s?(€|euros?|eur)/);
  if (direct) {
    const euros = Number(`${direct[1]}.${direct[2] || '0'}`);
    return Number.isFinite(euros) ? euros : null;
  }
  const plain = normalized.match(/presupuesto[^\d]{0,10}(\d{1,4})|hasta[^\d]{0,10}(\d{1,4})|menos de[^\d]{0,10}(\d{1,4})/);
  const value = plain?.slice(1).find(Boolean);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function detectPlatform(text: string): string | null {
  const normalized = text.toLowerCase();
  const matchesPattern = (pattern: string) => {
    if (pattern.length <= 3 && /^[a-z0-9]+$/i.test(pattern)) {
      return new RegExp(`(^|\\b)${pattern}(\\b|$)`, 'i').test(normalized);
    }
    return normalized.includes(pattern);
  };

  for (const platform of PLATFORM_KEYWORDS) {
    if (platform.patterns.some((pattern) => matchesPattern(pattern))) {
      return platform.label;
    }
  }
  return null;
}

function detectFranchise(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const rule of FRANCHISE_RULES) {
    if (normalized.includes(rule)) {
      return rule === 'pokemon' ? 'Pokémon' : rule.replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }
  return null;
}

function extractFacts(messages: AssistantMessage[]): ConversationFacts {
  const recentUserText = messages
    .filter((message) => message.role === 'user')
    .slice(-4)
    .map((message) => message.content)
    .join(' \n ');

  const lower = recentUserText.toLowerCase();
  const style = /seguro|f[aá]cil|sin arriesgar|safe/.test(lower)
    ? 'safe'
    : /especial|coleccion|coleccionable|sorpresa|premium|rareza|raro/.test(lower)
      ? 'special'
      : null;

  return {
    budget: parseBudget(recentUserText),
    platform: detectPlatform(recentUserText),
    style,
    wantsBundle: /pack|bundle|combo|oferta|lote/.test(lower),
    wantsPersonalized: /para m[ií]|seg[uú]n mis favoritos|basad|recomi[eé]ndame|recomiendame|qu[eé] me recomiendas|personaliz/.test(lower),
  };
}

function detectIntent(text: string, productHints: AssistantProductHint[]): AssistantIntent {
  const normalized = text.toLowerCase();

  if (/hola|buenas|hey|hello/.test(normalized)) return 'greeting';
  if (/mystery|ruleta|roulette|ticket(s)? de ruleta|tirada|spin/.test(normalized)) return 'mystery';
  if (/retroville|serie|show|universo/.test(normalized)) return 'retroville';
  if (/regalo|gift|recomienda|recomendaci[oó]n|busco algo|sorprender/.test(normalized)) return 'gift';
  if (/ticket|soporte|support|ayuda con mi cuenta|incidencia/.test(normalized)) return 'support';
  if (/pedido|order|mi compra/.test(normalized)) return 'order';
  if (/env[ií]o|shipping|tracking|seguimiento/.test(normalized)) return 'shipping';
  if (/devol|garant|rota|roto|defecto/.test(normalized)) return 'returns';
  if (/login|sesi[oó]n|google|entrar|cuenta/.test(normalized)) return 'login';
  if (/subasta|auction|puja|bid/.test(normalized)) return 'auction';
  if (/suscrip|membres[ií]a|vip|coleccionista|explorador/.test(normalized)) return 'memberships';
  if (/creador|portfolio|portafolio|joel/.test(normalized)) return 'creator';
  if (/tienda propia|crear tienda|marketplace|creadores|vender/.test(normalized)) return 'stores';
  if (/contacto|email|correo|tel[eé]fono|hablar con/.test(normalized)) return 'contact';
  if (/discord|comunidad|community|blog/.test(normalized)) return 'community';
  if (productHints.length > 0 || detectPlatform(normalized) || /producto|juego|pokemon|pok[eé]mon|pack|bundle|lote/.test(normalized)) return 'product-search';
  return 'fallback';
}

function buildRouteSuggestions(
  locale: AssistantLocale,
  intent: AssistantIntent,
  platform: string | null,
  userContext: AssistantUserContext
): AssistantLink[] {
  const links: AssistantLink[] = [];
  const push = (labelEs: string, href: string, labelEn?: string) => {
    const label = locale === 'en' ? labelEn || labelEs : labelEs;
    if (!links.some((item) => item.href === href)) links.push({ label, href });
  };

  push('Ir a tienda', '/tienda', 'Open store');

  if (platform) {
    push(`Buscar ${platform}`, `/tienda?q=${encodeURIComponent(platform)}`, `Search ${platform}`);
  }

  switch (intent) {
    case 'mystery':
      push('Mystery Boxes', '/mystery-boxes');
      push('Ruleta', '/ruleta', 'Roulette');
      break;
    case 'order':
    case 'shipping':
    case 'returns':
    case 'support':
      push('Mis pedidos', '/perfil?tab=orders', 'My orders');
      push('Mis tickets', '/perfil?tab=tickets', 'My tickets');
      push('Mi perfil', '/perfil', 'My profile');
      break;
    case 'login':
      push(userContext.isLoggedIn ? 'Mi perfil' : 'Entrar', userContext.isLoggedIn ? '/perfil' : '/login', userContext.isLoggedIn ? 'My profile' : 'Sign in');
      push('Mis pedidos', '/perfil?tab=orders', 'My orders');
      break;
    case 'auction':
      push('Subastas', '/subastas', 'Auctions');
      break;
    case 'memberships':
      push('Membresías', '/memberships', 'Memberships');
      push('Gestionar plan', '/memberships/manage', 'Manage membership');
      break;
    case 'creator':
      push('Creador', '/creator', 'Creator');
      push('Contacto', '/contacto', 'Contact');
      break;
    case 'stores':
      push('Crear mi tienda', '/crear-tienda', 'Create my store');
      push('Tiendas de la comunidad', '/tiendas', 'Community stores');
      push('Membresías', '/memberships', 'Memberships');
      break;
    case 'contact':
      push('Contacto', '/contacto', 'Contact');
      push('Mi perfil', '/perfil', 'My profile');
      break;
    case 'community':
      push('Comunidad', '/comunidad', 'Community');
      push('Blog', '/blog', 'Blog');
      break;
    case 'retroville':
      push('Retroville', '/retroville');
      push('YouTube de Retroville', 'https://www.youtube.com/@RetroVille-y9v');
      push('Instagram de Retroville', 'https://www.instagram.com/retroville_show/');
      break;
    default:
      break;
  }

  return links.slice(0, 6);
}

async function findProductHints(
  userText: string,
  budget: number | null,
  platform: string | null
): Promise<AssistantProductHint[]> {
  const query = buildProductQuery(userText);
  if (!supabaseAdmin || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase();
  if (PRODUCT_QUERY_GENERIC_WORDS.has(normalizedQuery)) return [];

  const keywords = query.split(' ').filter(Boolean).slice(0, 5);
  if (keywords.length === 0) return [];

  let builder = supabaseAdmin.from('products').select('id,name,price,stock').limit(10);
  const ilikePatterns = [normalizedQuery, ...keywords.map((keyword) => keyword.toLowerCase())]
    .map((term) => `%${term}%`)
    .slice(0, 5);

  if (ilikePatterns.length > 0) {
    const orExpr = ilikePatterns.map((pattern) => `name.ilike.${pattern}`).join(',');
    builder = builder.or(orExpr);
  }

  if (budget && Number.isFinite(budget)) {
    builder = builder.lte('price', Math.max(0, Math.round(budget * 100)));
  }

  const { data, error } = await builder;
  if (error || !Array.isArray(data)) return [];

  return data
    .map((row: Record<string, unknown>) => {
      const name = String(row?.name || '');
      const nameLower = name.toLowerCase();
      const category = classifyProductType(name);
      let score = 0;
      for (const keyword of keywords) {
        if (nameLower.includes(keyword.toLowerCase())) score += 2;
      }
      if (nameLower.includes(normalizedQuery)) score += 4;
      if (category === 'game' || category === 'collectible' || category === 'console') score += 3;
      if (category === 'accessory') score -= 5;
      if (budget && budget >= 20 && Number(row?.price || 0) < 1000) score -= 2;
      return {
        id: String(row?.id || ''),
        name,
        priceCents: Math.max(0, Math.round(Number(row?.price || 0))),
        stock: Math.max(0, Math.round(Number(row?.stock || 0))),
        href: getProductHref(row),
        category,
        score,
      };
    })
    .filter((item) => item.id && item.name)
    .filter((item) => !platform || productMatchesPlatform(item.name, platform))
    .sort((a, b) => b.score - a.score || a.priceCents - b.priceCents)
    .slice(0, 4)
    .map(({ score: _score, ...rest }) => rest);
}

function classifyProductType(name: string): AssistantProductHint['category'] {
  const normalized = name.toLowerCase();

  if (/protector|funda|insert|manual|caja|box protector|sleeve|caratula|carátula/.test(normalized)) {
    return 'accessory';
  }

  if (/consola|console|playstation|xbox|nintendo ds|game boy/.test(normalized)) {
    return 'console';
  }

  if (/pokemon|pokémon|zelda|mario|metroid|kirby|juego|game|cartucho|cartridge/.test(normalized)) {
    return 'game';
  }

  if (/collector|coleccion|coleccionable|promo|limited|rare|trading/.test(normalized)) {
    return 'collectible';
  }

  return 'unknown';
}

function productMatchesPlatform(name: string, platform: string): boolean {
  const normalizedName = name.toLowerCase();
  const platformEntry = PLATFORM_KEYWORDS.find((entry) => entry.label === platform);
  if (!platformEntry) return true;

  return platformEntry.patterns.some((pattern) => {
    if (pattern.length <= 3 && /^[a-z0-9]+$/i.test(pattern)) {
      return new RegExp(`(^|\\b)${pattern}(\\b|$)`, 'i').test(normalizedName);
    }
    return normalizedName.includes(pattern.toLowerCase());
  });
}

function formatPrice(cents: number, locale: AssistantLocale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, cents) / 100);
}

function formatProductList(products: AssistantProductHint[], locale: AssistantLocale): string {
  return products
    .map((product) => {
      const stockLabel =
        product.stock > 0
          ? locale === 'en'
            ? `${product.stock} in stock`
            : `${product.stock} en stock`
          : locale === 'en'
            ? 'check availability'
            : 'consultar disponibilidad';
      return `- ${product.name} · ${formatPrice(product.priceCents, locale)} · ${stockLabel}`;
    })
    .join('\n');
}

function membershipSummary(locale: AssistantLocale): string {
  return MEMBERSHIP_PLANS.map((plan) => {
    const yearly = plan.yearlyPrice > 0 ? ` / ${plan.yearlyPrice}€ año` : '';
    return locale === 'en'
      ? `- ${plan.name}: ${plan.monthlyPrice}€/month${plan.yearlyPrice > 0 ? ` / ${plan.yearlyPrice}€/year` : ''}. ${plan.description}`
      : `- ${plan.name}: ${plan.monthlyPrice}€/mes${yearly}. ${plan.description}`;
  }).join('\n');
}

function looksLikeOnlyAccessorySet(products: AssistantProductHint[], budget: number | null): boolean {
  if (products.length === 0) return false;
  const allAccessories = products.every((product) => product.category === 'accessory');
  if (!allAccessories) return false;

  if (!budget) return true;
  return products.every((product) => product.priceCents <= Math.max(900, budget * 35));
}

function humanList(values: string[], locale: AssistantLocale): string {
  const filtered = values.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return locale === 'en' ? `${filtered[0]} and ${filtered[1]}` : `${filtered[0]} y ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}${locale === 'en' ? ', and ' : ' y '}${filtered[filtered.length - 1]}`;
}

function formatDateLite(value: string | null, locale: AssistantLocale): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function buildBundleIdeas(products: AssistantProductHint[], locale: AssistantLocale): string[] {
  if (products.length < 2) return [];
  const main = products.find((product) => product.category !== 'accessory') || products[0];
  const addon = products.find((product) => product.id !== main.id && product.category === 'accessory');
  const extra = products.find((product) => product.id !== main.id && product.id !== addon?.id);

  const ideas: string[] = [];
  if (main && addon) {
    ideas.push(
      locale === 'en'
        ? `Starter pack: ${main.name} + ${addon.name}.`
        : `Pack inicial: ${main.name} + ${addon.name}.`
    );
  }
  if (main && extra && extra.id !== addon?.id) {
    ideas.push(
      locale === 'en'
        ? `Collector angle: ${main.name} with ${extra.name}.`
        : `Ángulo coleccionista: ${main.name} con ${extra.name}.`
    );
  }
  return ideas.slice(0, 2);
}

function buildPersonalizationLead(locale: AssistantLocale, userContext: AssistantUserContext): string {
  if (!userContext.isLoggedIn || userContext.favoriteProducts.length === 0) return '';
  const fragments: string[] = [];
  if (userContext.favoriteFranchises.length > 0) {
    fragments.push(locale === 'en'
      ? `I can see strong interest in ${humanList(userContext.favoriteFranchises, locale)}`
      : `Veo bastante interés en ${humanList(userContext.favoriteFranchises, locale)}`);
  }
  if (userContext.favoritePlatforms.length > 0) {
    fragments.push(locale === 'en'
      ? `and also in ${humanList(userContext.favoritePlatforms, locale)}`
      : `y también en ${humanList(userContext.favoritePlatforms, locale)}`);
  }
  if (fragments.length === 0) return '';
  return `${fragments.join(' ')}.`;
}

function buildAccountSnapshot(locale: AssistantLocale, userContext: AssistantUserContext): string {
  if (!userContext.isLoggedIn) {
    return locale === 'en'
      ? 'I cannot see a logged-in session right now, so I can only answer at store level.'
      : 'Ahora mismo no detecto una sesión iniciada, así que solo puedo responder a nivel general de tienda.';
  }

  const parts: string[] = [];
  const latestOrder = userContext.recentOrders[0];
  if (latestOrder) {
    const dateText = formatDateLite(latestOrder.createdAt, locale);
    const orderPart = locale === 'en'
      ? `Your latest order is ${latestOrder.status}${dateText ? ` (${dateText})` : ''}.`
      : `Tu pedido más reciente está en estado ${latestOrder.status}${dateText ? ` (${dateText})` : ''}.`;
    parts.push(orderPart);
    if (latestOrder.trackingCode) {
      parts.push(locale === 'en'
        ? `Tracking detected: ${latestOrder.trackingCode}.`
        : `He detectado tracking: ${latestOrder.trackingCode}.`);
    }
  }

  if (userContext.openTickets.length > 0) {
    const latestTicket = userContext.openTickets[0];
    parts.push(locale === 'en'
      ? `You have ${userContext.openTickets.length} open support ticket(s); the latest is “${latestTicket.subject}” in ${latestTicket.status}.`
      : `Tienes ${userContext.openTickets.length} ticket(s) abiertos; el último es “${latestTicket.subject}” y está en ${latestTicket.status}.`);
  }

  if (parts.length === 0) {
    parts.push(locale === 'en'
      ? 'Your account looks clean right now: no recent active ticket and nothing obviously blocked on my side.'
      : 'Tu cuenta se ve limpia ahora mismo: no veo tickets activos recientes ni nada bloqueado de forma evidente.');
  }

  return parts.join(' ');
}

function buildReply(params: {
  locale: AssistantLocale;
  intent: AssistantIntent;
  latestUserText: string;
  facts: ConversationFacts;
  productHints: AssistantProductHint[];
  userContext: AssistantUserContext;
}): string {
  const { locale, intent, facts, productHints, userContext } = params;
  const isEn = locale === 'en';
  const platform = facts.platform || ((facts.wantsPersonalized || intent === 'gift' || intent === 'product-search') ? userContext.favoritePlatforms[0] || null : null);
  const budgetText = facts.budget ? (isEn ? `around ${facts.budget}€` : `sobre ${facts.budget}€`) : null;
  const onlyAccessoryMatches = looksLikeOnlyAccessorySet(productHints, facts.budget);
  const productsBlock = productHints.length > 0
    ? `\n\n${isEn ? 'I have already found a few options that fit:' : 'Ya he encontrado algunas opciones que encajan:'}\n${formatProductList(productHints, locale)}`
    : '';
  const knowledgeMystery = formatKnowledgeTopic(locale, 'mystery');
  const knowledgeRetroville = formatKnowledgeTopic(locale, 'retroville');
  const knowledgeShipping = formatKnowledgeTopic(locale, 'shipping');
  const knowledgeReturns = formatKnowledgeTopic(locale, 'returns');
  const knowledgeMemberships = getAssistantKnowledge(locale, 'memberships');
  const knowledgeCreator = formatKnowledgeTopic(locale, 'creator');
  const knowledgeCommunity = formatKnowledgeTopic(locale, 'community');
  const knowledgeSupport = formatKnowledgeTopic(locale, 'support');
  const personalizationLead = buildPersonalizationLead(locale, userContext);
  const bundleIdeas = facts.wantsBundle ? buildBundleIdeas(productHints, locale) : [];
  const bundleBlock = bundleIdeas.length > 0
    ? `\n\n${isEn ? 'Bundle ideas:' : 'Ideas de pack:'}\n- ${bundleIdeas.join('\n- ')}`
    : '';

  switch (intent) {
    case 'greeting': {
      const base = formatKnowledgeTopic(locale, 'greeting');
      const personal = userContext.isLoggedIn && userContext.favoriteProducts.length > 0
        ? ` ${personalizationLead} ${isEn ? 'If you want, I can use that to recommend products more intelligently.' : 'Si quieres, puedo usar eso para recomendarte productos con más criterio.'}`
        : '';
      return `${base}${personal}`.trim();
    }
    case 'mystery':
      return knowledgeMystery;
    case 'retroville':
      return knowledgeRetroville;
    case 'gift':
      return `${isEn ? 'Yes, we can narrow it down properly.' : 'Sí, podemos afinarlo bien.'}${platform ? (isEn ? ` I already have ${platform} as the main platform.` : ` Ya tengo ${platform} como plataforma principal.`) : ''}${budgetText ? (isEn ? ` I also have a budget ${budgetText}.` : ` También tengo un presupuesto ${budgetText}.`) : ''}${facts.style === 'safe' ? (isEn ? ' Since you want something safe, I would prioritise recognisable titles or clean accessories.' : ' Como buscas algo seguro, priorizaría títulos reconocibles o accesorios limpios.') : facts.style === 'special' ? (isEn ? ' Since you want something more special, I would prioritise more collectible or characterful items.' : ' Como buscas algo más especial, priorizaría piezas con más carácter o valor coleccionable.') : platform || budgetText ? (isEn ? ' The next useful detail is whether you want something safe or something more collectible.' : ' El siguiente dato útil es si prefieres algo seguro o algo más coleccionable.') : (isEn ? ' If you tell me the platform and budget, I can refine it properly.' : ' Si me dices plataforma y presupuesto, te lo afino de verdad.')} ${facts.wantsPersonalized && personalizationLead ? personalizationLead : facts.wantsPersonalized && userContext.isLoggedIn ? (isEn ? 'I can use your favourites and recent interests to personalise the recommendation.' : 'Puedo usar tus favoritos e intereses recientes para personalizar la recomendación.') : ''}${onlyAccessoryMatches ? (isEn ? ' Right now the clean matches I am seeing are more accessory-like than “main gift” material, so I would treat them as backup options unless you specifically want protectors or storage.' : ' Ahora mismo las coincidencias más limpias que veo son más accesorio que “regalo principal”, así que las tomaría como plan B salvo que justo busques protectores o almacenaje.') : ''}${productsBlock}${bundleBlock}`.trim();
    case 'support':
      return `${knowledgeSupport} ${buildAccountSnapshot(locale, userContext)}`.trim();
    case 'order':
      return `${isEn ? 'If this is about a specific order, the best route is your profile order tab.' : 'Si esto va sobre un pedido concreto, la ruta buena es la pestaña de pedidos de tu perfil.'} ${buildAccountSnapshot(locale, userContext)}`.trim();
    case 'shipping':
      return `${knowledgeShipping} ${buildAccountSnapshot(locale, userContext)}`.trim();
    case 'returns':
      return `${knowledgeReturns} ${buildAccountSnapshot(locale, userContext)}`.trim();
    case 'login':
      if (userContext.isLoggedIn) {
        return isEn
          ? `Your session looks active on my side. If what you want is to review orders, tickets or favourites, the clean route is your profile. ${buildAccountSnapshot(locale, userContext)}`
          : `Tu sesión parece activa por mi lado. Si lo que quieres es revisar pedidos, tickets o favoritos, la ruta limpia es tu perfil. ${buildAccountSnapshot(locale, userContext)}`;
      }
      return isEn
        ? 'I cannot see an active session right now. Try the login page first and, if it keeps failing, open a support route with the device and the exact error.'
        : 'Ahora mismo no veo una sesión activa. Prueba primero la página de login y, si sigue fallando, abre soporte indicando dispositivo y error exacto.';
    case 'auction':
      return isEn
        ? 'For auctions, the best next move is opening the section directly because timing can move. If you tell me the type of piece you want, I can narrow the category first.'
        : 'Para subastas, lo mejor es abrir la sección directamente porque el timing puede moverse. Si me dices qué tipo de pieza buscas, te oriento primero por categoría.';
    case 'memberships':
      return `${knowledgeMemberships.lead || ''} ${(knowledgeMemberships.details || []).join(' ')}\n\n${membershipSummary(locale)}`.trim();
    case 'creator':
      return knowledgeCreator;
    case 'stores':
      return isEn
        ? 'The creator-store system sits inside the wider AdvancedRetro ecosystem. If you want to launch yours, review memberships first because product limits and perks depend on the plan.'
        : 'El sistema de tiendas de creadores vive dentro del ecosistema ampliado de AdvancedRetro. Si quieres lanzar la tuya, revisa antes las membresías porque límites y ventajas dependen del plan.';
    case 'contact':
      return isEn
        ? 'For direct contact or something sensitive, use the contact page. If it is tied to an order or account, profile plus support ticket is still the cleanest route.'
        : 'Para contacto directo o algo sensible, usa la página de contacto. Si está ligado a un pedido o a tu cuenta, sigue siendo más limpio perfil más ticket de soporte.';
    case 'community':
      return knowledgeCommunity;
    case 'product-search':
      if (productHints.length > 0) {
        return `${facts.wantsPersonalized && personalizationLead ? `${personalizationLead} ` : ''}${isEn ? `I found a few catalogue options${platform ? ` for ${platform}` : ''}.` : `He encontrado varias opciones del catálogo${platform ? ` para ${platform}` : ''}.`}${budgetText ? (isEn ? ` They stay ${budgetText}.` : ` Se quedan ${budgetText}.`) : ''}\n\n${formatProductList(productHints, locale)}${bundleBlock}`;
      }
      return isEn
        ? 'I did not get a clean product match yet. Tell me the platform, budget and whether you want something safe or collectible, and I will narrow it down more coherently.'
        : 'Todavía no me ha salido una coincidencia de producto limpia. Dime plataforma, presupuesto y si buscas algo seguro o más coleccionable y te lo afino con más criterio.';
    default:
      return `${isEn ? 'I can help with products, orders, shipping, memberships, Retroville and the wider ecosystem.' : 'Puedo ayudarte con productos, pedidos, envíos, membresías, Retroville y el ecosistema general.'} ${facts.wantsPersonalized && personalizationLead ? personalizationLead : ''} ${buildAccountSnapshot(locale, userContext)}`.trim();
  }
}

function buildSearchBasis(
  latestUserText: string,
  facts: ConversationFacts,
  userContext: AssistantUserContext
): string {
  const parts = [latestUserText];
  if (!facts.platform && userContext.favoritePlatforms.length > 0 && facts.wantsPersonalized) {
    parts.push(userContext.favoritePlatforms[0]);
  }
  if (!detectFranchise(latestUserText) && userContext.favoriteFranchises.length > 0 && facts.wantsPersonalized) {
    parts.push(userContext.favoriteFranchises[0]);
  }
  return parts.filter(Boolean).join(' ');
}

export async function buildLocalAssistantResponse(
  locale: AssistantLocale,
  messages: AssistantMessage[],
  userContext?: AssistantUserContext
): Promise<AssistantResponsePayload> {
  const latestUserText = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const facts = extractFacts(messages);
  const safeUserContext: AssistantUserContext = userContext || {
    isLoggedIn: false,
    userId: null,
    profileName: null,
    favoriteProducts: [],
    favoritePlatforms: [],
    favoriteFranchises: [],
    recentOrders: [],
    openTickets: [],
  };
  const initialIntent = detectIntent(latestUserText, []);
  const shouldSearchProducts =
    initialIntent === 'gift' ||
    initialIntent === 'product-search' ||
    (safeUserContext.isLoggedIn && facts.wantsPersonalized);
  const searchBasis = buildSearchBasis(latestUserText, facts, safeUserContext);
  const productHints = shouldSearchProducts
    ? await findProductHints(searchBasis || latestUserText, facts.budget, facts.platform || safeUserContext.favoritePlatforms[0] || null)
    : [];
  const intent = detectIntent(latestUserText, productHints);
  const links = buildRouteSuggestions(locale, intent, facts.platform || safeUserContext.favoritePlatforms[0] || null, safeUserContext);
  const message = buildReply({
    locale,
    intent,
    latestUserText,
    facts,
    productHints,
    userContext: safeUserContext,
  });

  const finalLinks = [
    ...links,
    ...productHints.map((product) => ({
      label: locale === 'en' ? `Product: ${product.name}` : `Producto: ${product.name}`,
      href: product.href,
    })),
  ].filter((item, index, array) => array.findIndex((entry) => entry.href === item.href) === index);

  return {
    provider: 'local',
    message,
    content: message,
    links: finalLinks.slice(0, 6),
    productMatches: productHints,
  };
}
