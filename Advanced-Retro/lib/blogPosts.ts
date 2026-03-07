export type BlogPostSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  keywords: string[];
  image: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  sections: BlogPostSection[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'como-valorar-juego-retro-original-vs-repro',
    title: 'Cómo valorar un juego retro: original vs repro sin errores de compra',
    description:
      'Guía práctica para diferenciar original y repro en juegos retro, evitar sobreprecio y comprar con criterio de coleccionista.',
    excerpt:
      'Aprende a revisar estado, completitud y precio para no confundir una pieza original con una reproducción 1:1.',
    category: 'Guía de compra',
    keywords: ['original vs repro', 'comprar juego retro', 'coleccionismo retro', 'precio juego retro'],
    image: '/logo.png',
    publishedAt: '2026-03-06',
    updatedAt: '2026-03-06',
    readMinutes: 8,
    sections: [
      {
        heading: 'El error más común al comprar retro',
        paragraphs: [
          'Muchos compradores ven una portada conocida, un precio aparentemente correcto y asumen que la pieza es original sin revisar detalles clave. Ese atajo mental es el origen de la mayoría de decepciones en retro gaming.',
          'La diferencia entre original y repro no siempre está en una sola pista visual. Suele estar en la suma de varias señales: etiqueta, materiales, calidad de impresión, tono del plástico, códigos internos y coherencia con la edición.',
        ],
      },
      {
        heading: 'Checklist rápido antes de pagar',
        paragraphs: [
          'Primero revisa fotos reales y que no sean genéricas. Segundo valida qué incluye exactamente el artículo: cartucho, caja, manual, insert y protector son elementos distintos y cada uno cambia valor.',
          'Después compara precio con referencias de mercado. No se trata de copiar una cifra exacta, sino de entender si el producto está dentro de un rango razonable para su estado y presentación.',
        ],
      },
      {
        heading: 'Cuándo una repro sí tiene sentido',
        paragraphs: [
          'Una reproducción puede ser una solución útil cuando quieres completar una edición visual o tener una alternativa económica para exposición, siempre que esté claramente identificada como repro.',
          'El problema no es la repro en sí, sino pagar precio de original por una pieza que no lo es. La transparencia en ficha de producto y una navegación clara por tipos de artículo evitan ese conflicto.',
        ],
      },
    ],
  },
  {
    slug: 'guia-completar-juego-caja-manual-insert-protector',
    title: 'Guía para completar un juego retro: caja, manual, insert y protector',
    description:
      'Método para montar juegos completos por fases, controlando presupuesto y evitando compras duplicadas innecesarias.',
    excerpt:
      'Un flujo práctico para pasar de cartucho suelto a edición completa sin perder control de coste ni coherencia de colección.',
    category: 'Coleccionismo',
    keywords: ['juego completo', 'caja manual insert protector', 'coleccionismo game boy', 'completar juego retro'],
    image: '/logo.png',
    publishedAt: '2026-03-05',
    updatedAt: '2026-03-06',
    readMinutes: 7,
    sections: [
      {
        heading: 'Empieza por definir objetivo de colección',
        paragraphs: [
          'No todas las colecciones tienen el mismo objetivo. Algunas priorizan jugabilidad, otras presentación en vitrina y otras conservación histórica de versiones concretas.',
          'Definir ese objetivo al inicio te ahorra compras impulsivas. Si quieres vitrina, puede bastarte una combinación mixta. Si buscas purismo, tendrás que ser más exigente con estado y autenticidad.',
        ],
      },
      {
        heading: 'Orden correcto de compra por eficiencia',
        paragraphs: [
          'En muchos casos, la secuencia más eficiente es cartucho primero, luego caja, después manual e insert. El protector se compra al final para conservar lo que ya tienes.',
          'Este orden reduce riesgo financiero porque bloqueas antes la pieza principal y evitas pagar de más por componentes cuando aún no sabes si cerrarás ese título en completo.',
        ],
      },
      {
        heading: 'Cómo no perder dinero en duplicados',
        paragraphs: [
          'Usa listas de favoritos y notas por juego para saber qué componente te falta exactamente. Si compras sin control de inventario, terminarás acumulando manuales o cajas repetidas.',
          'Una tienda con filtros por tipo y plataforma te permite encontrar solo lo que necesitas en cada momento, en lugar de navegar un catálogo mezclado que aumenta confusión.',
        ],
      },
    ],
  },
  {
    slug: 'precio-retro-mercado-evitar-sobrepago',
    title: 'Precio retro y mercado: cómo evitar sobrepago al comprar en 2026',
    description:
      'Interpretar rangos de mercado en retro gaming para pagar un precio coherente según estado, rareza y demanda.',
    excerpt:
      'No compres por miedo a perder oportunidad: aprende a leer rango, mediana y contexto antes de decidir.',
    category: 'Mercado',
    keywords: ['precio retro', 'mercado retro', 'comparar precio videojuego', 'evitar sobrepago'],
    image: '/logo.png',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-06',
    readMinutes: 9,
    sections: [
      {
        heading: 'Un precio aislado no te dice nada',
        paragraphs: [
          'Ver un solo anuncio barato o caro no representa el mercado real. Necesitas rango y distribución para entender dónde cae ese producto respecto al conjunto.',
          'Por eso la referencia útil no es solo máximo o mínimo, sino también mediana y media, siempre interpretadas junto al estado del artículo.',
        ],
      },
      {
        heading: 'Factores que alteran el valor real',
        paragraphs: [
          'Dos productos con el mismo nombre pueden tener valor distinto por idioma, edición regional, conservación del cartón, desgaste de etiqueta o presencia de manual e insert.',
          'En coleccionismo, el detalle pesa. Un precio correcto para cartucho suelto puede ser malo para completo en caja, y viceversa.',
        ],
      },
      {
        heading: 'Decidir con cabeza en vez de FOMO',
        paragraphs: [
          'El miedo a perder una oportunidad (FOMO) es uno de los mayores enemigos del comprador retro. Si no comparas contexto, acabarás sobrepagando piezas que luego aparecen de nuevo.',
          'La estrategia más robusta es simple: revisa ficha, compara rango y decide según objetivo de colección. Esa disciplina mejora resultados a largo plazo.',
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const safeSlug = String(slug || '').trim().toLowerCase();
  return BLOG_POSTS.find((post) => post.slug === safeSlug) || null;
}

