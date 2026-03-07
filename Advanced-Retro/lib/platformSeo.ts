export type PlatformLandingSlug =
  | 'game-boy'
  | 'game-boy-color'
  | 'game-boy-advance'
  | 'super-nintendo'
  | 'gamecube'
  | 'consolas';

type PlatformLandingConfig = {
  slug: PlatformLandingSlug;
  label: string;
  title: string;
  description: string;
  keywords: string[];
  intro: string[];
  faq: Array<{ question: string; answer: string }>;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMysteryBoxProduct(product: any): boolean {
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  if (category === 'cajas-misteriosas') return true;
  return Boolean(product?.is_mystery_box);
}

function isLikelyComponentProduct(product: any): boolean {
  const componentType = String(product?.component_type || '').toLowerCase();
  if (componentType && componentType !== 'full_game' && componentType !== 'cartucho') return true;

  const source = normalizeText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  return (
    source.includes('manual') ||
    source.includes('insert') ||
    source.includes('inlay') ||
    source.includes('protector') ||
    source.includes('pegatina')
  );
}

export const PLATFORM_LANDING_CONFIG: Record<PlatformLandingSlug, PlatformLandingConfig> = {
  'game-boy': {
    slug: 'game-boy',
    label: 'Game Boy',
    title: 'Comprar juegos y piezas Game Boy',
    description:
      'Catálogo Game Boy en España con juegos, cajas y componentes para coleccionismo retro con stock y estado visible.',
    keywords: ['game boy', 'comprar game boy', 'juegos game boy españa', 'coleccionismo game boy'],
    intro: [
      'La sección de Game Boy está pensada para compradores que buscan tanto cartuchos clásicos como piezas para completar colección. Aquí no se trata solo de ver un listado de productos: la intención es que puedas comparar títulos, estado y rango de precio de forma rápida con filtros orientados a uso real.',
      'Si vienes de una búsqueda en Google tipo “comprar juego Game Boy original” o “caja Game Boy”, esta landing te sirve como puerta de entrada clara. Puedes abrir ficha de cada producto, revisar disponibilidad y decidir si te interesa compra directa o seguimiento por encargo si buscas una edición concreta.',
    ],
    faq: [
      {
        question: '¿Vendéis solo cartuchos de Game Boy o también componentes?',
        answer: 'La tienda incluye juegos y, según disponibilidad, piezas complementarias para coleccionismo.',
      },
      {
        question: '¿Puedo filtrar por precio en Game Boy?',
        answer: 'Sí, puedes combinar rango de precio manual y rangos rápidos desde el panel de filtros.',
      },
    ],
  },
  'game-boy-color': {
    slug: 'game-boy-color',
    label: 'Game Boy Color',
    title: 'Catálogo Game Boy Color para coleccionistas',
    description:
      'Explora Game Boy Color con productos revisados, comparativa de precios y fichas claras para compra en España.',
    keywords: ['game boy color', 'juegos game boy color', 'comprar gbc', 'coleccionismo gbc'],
    intro: [
      'Game Boy Color es una de las plataformas con más variaciones de estado y presentación en mercado secundario. Esta landing agrupa referencias compatibles para facilitar búsquedas por título y precio.',
      'La recomendación es usar primero filtro por plataforma y luego ordenar por novedades o precio. Así reduces ruido y encuentras más rápido piezas útiles para jugar o completar estantería.',
    ],
    faq: [
      {
        question: '¿La sección GBC incluye precios en euros con stock?',
        answer: 'Sí, el catálogo muestra precio en EUR y estado de stock de cada artículo visible.',
      },
      {
        question: '¿Puedo usar favoritos para guardar juegos GBC?',
        answer: 'Sí, al iniciar sesión puedes guardar favoritos y reutilizar filtros con esa selección.',
      },
    ],
  },
  'game-boy-advance': {
    slug: 'game-boy-advance',
    label: 'Game Boy Advance',
    title: 'Juegos y coleccionismo Game Boy Advance',
    description:
      'Landing GBA con fichas de producto, filtros por tipo y enfoque en compra retro desde España.',
    keywords: ['game boy advance', 'juegos gba', 'comprar gba', 'tienda gba españa'],
    intro: [
      'La plataforma Game Boy Advance mezcla catálogo masivo y piezas con comportamiento de precio muy distinto según edición y estado. Por eso esta página está orientada a navegación por intención: compra rápida o compra de colección.',
      'Si buscas claridad, abre la ficha del producto para ver información consolidada de precio, descripción y disponibilidad. El sistema está preparado para escalar catálogo sin perder orden en URLs y arquitectura.',
    ],
    faq: [
      {
        question: '¿Hay filtros por tipo de artículo en GBA?',
        answer: 'Sí, puedes filtrar por tipo para separar juegos de otros elementos del catálogo.',
      },
      {
        question: '¿Hay soporte si busco una edición concreta de GBA?',
        answer: 'Sí, puedes usar el servicio de encargo para búsqueda asistida.',
      },
    ],
  },
  'super-nintendo': {
    slug: 'super-nintendo',
    label: 'Super Nintendo',
    title: 'Super Nintendo: juegos y piezas retro verificadas',
    description:
      'Descubre catálogo SNES con estructura SEO limpia, productos indexables y navegación para coleccionismo.',
    keywords: ['super nintendo', 'snes', 'comprar juegos snes', 'tienda super nintendo'],
    intro: [
      'Super Nintendo sigue siendo una de las búsquedas más fuertes del mercado retro. Esta landing está optimizada para responder intención comercial: localizar juegos SNES y validar rápidamente si encajan en presupuesto y objetivo de colección.',
      'La clave está en combinar filtros y revisar ficha antes de compra. En contexto SNES, pequeñas diferencias de estado pueden cambiar mucho la percepción de valor, por eso conviene revisar cada producto con detalle.',
    ],
    faq: [
      {
        question: '¿Esta sección está enfocada a compras en España?',
        answer: 'Sí, está orientada a compradores en España con proceso de compra y soporte local.',
      },
      {
        question: '¿Puedo comparar precios de referencia en algunos productos?',
        answer: 'Sí, en productos compatibles se muestra comparativa de mercado para aportar contexto.',
      },
    ],
  },
  gamecube: {
    slug: 'gamecube',
    label: 'GameCube',
    title: 'Catálogo GameCube con enfoque de coleccionismo',
    description:
      'Tienda GameCube con fichas claras, filtros avanzados y estructura pensada para compra retro segura.',
    keywords: ['gamecube', 'juegos gamecube', 'comprar gamecube', 'coleccionismo gamecube'],
    intro: [
      'GameCube combina títulos masivos y referencias difíciles de conseguir, por eso esta landing prioriza orden y legibilidad sobre volumen bruto de tarjetas. La idea es que en pocos clics puedas pasar de búsqueda general a producto concreto.',
      'Si el objetivo es comprar con criterio de coleccionista, usa filtros por precio y estado y revisa siempre descripción de ficha. Esta metodología reduce compras impulsivas y mejora precisión de selección.',
    ],
    faq: [
      {
        question: '¿Cómo encontrar rápido juegos GameCube en rango de precio?',
        answer: 'Usa el rango de precio y orden por precio o novedades en el panel de filtros.',
      },
      {
        question: '¿Se puede guardar lista GameCube para revisar luego?',
        answer: 'Sí, con sesión iniciada puedes marcar favoritos para crear tu shortlist.',
      },
    ],
  },
  consolas: {
    slug: 'consolas',
    label: 'Consolas retro',
    title: 'Consolas retro y hardware de colección',
    description:
      'Apartado de consolas retro con hardware, ediciones especiales y piezas seleccionadas para coleccionismo.',
    keywords: ['consolas retro', 'comprar consola retro', 'hardware retro', 'ediciones especiales consola'],
    intro: [
      'La sección de consolas reúne hardware retro, modelos especiales y piezas seleccionadas para compradores que buscan algo más que cartuchos. Esta landing está preparada para búsquedas de intención directa como “comprar consola retro” o “edición especial Game Boy”.',
      'Para una selección eficiente, revisa primero la ficha visual y luego valida precio, descripción y estado. En hardware retro, coherencia entre foto y detalle de producto es clave para generar confianza.',
    ],
    faq: [
      {
        question: '¿Hay ediciones especiales de consolas en esta sección?',
        answer: 'Sí, se incluyen productos de consola orientados a coleccionismo y variantes especiales.',
      },
      {
        question: '¿La tienda muestra stock en consolas?',
        answer: 'Sí, cada ficha refleja disponibilidad cuando aplica.',
      },
    ],
  },
};

export const PLATFORM_LANDING_SLUGS = Object.keys(PLATFORM_LANDING_CONFIG) as PlatformLandingSlug[];

export function getPlatformLandingConfig(slug: string): PlatformLandingConfig | null {
  const safe = String(slug || '').trim().toLowerCase() as PlatformLandingSlug;
  return PLATFORM_LANDING_CONFIG[safe] || null;
}

export function platformMatchesProduct(product: any, slug: PlatformLandingSlug): boolean {
  const name = normalizeText(String(product?.name || ''));
  const description = normalizeText(String(product?.description || ''));
  const category = normalizeText(String(product?.category || product?.category_id || ''));
  const platform = normalizeText(String(product?.platform || ''));
  const componentType = normalizeText(String(product?.component_type || ''));
  const source = `${name} ${description} ${category} ${platform} ${componentType}`.trim();

  if (slug === 'consolas') {
    return (
      category.includes('consolas retro') ||
      category.includes('consola') ||
      name.startsWith('consola ') ||
      name.includes(' consola ') ||
      name.includes('dmg 01') ||
      componentType === 'consola' ||
      componentType === 'console'
    );
  }
  if (slug === 'game-boy-color') {
    return source.includes('game boy color') || source.includes('gameboy color');
  }
  if (slug === 'game-boy-advance') {
    return source.includes('game boy advance') || source.includes('gameboy advance');
  }
  if (slug === 'super-nintendo') {
    return source.includes('super nintendo') || source.includes('snes');
  }
  if (slug === 'gamecube') {
    return source.includes('gamecube') || source.includes('game cube');
  }
  if (slug === 'game-boy') {
    const isOtherSpecific =
      source.includes('game boy color') ||
      source.includes('gameboy color') ||
      source.includes('game boy advance') ||
      source.includes('gameboy advance');
    if (isOtherSpecific) return false;
    return source.includes('game boy') || source.includes('gameboy');
  }
  return false;
}

export function isSeoLandingProduct(product: any, slug: PlatformLandingSlug): boolean {
  if (!platformMatchesProduct(product, slug)) return false;
  if (isMysteryBoxProduct(product)) return false;
  if (isLikelyComponentProduct(product)) return false;
  return true;
}

