export const sampleCategories = [
  { id: 'cat-1', name: 'Game Boy Clásica', slug: 'gameboy-classic' },
  { id: 'cat-2', name: 'Color Series', slug: 'gameboy-color' },
  { id: 'cat-3', name: 'Mystery Boxes', slug: 'cajas-misteriosas' },
];

export const sampleProducts = [
  {
    id: 'prod-1',
    name: 'Consola Game Boy DMG original',
    slug: 'consola-game-boy-dmg-original',
    price: 14999,
    status: 'special',
    stock: 4,
    category_id: 'cat-1',
    description: 'Consola clásica revisada y lista para colección.',
    long_description: 'Game Boy DMG revisada, botones limpios y carcasa en buen estado general.',
    curiosities: ['Primer modelo lanzado en 1989.'],
    tips: ['Guarda la caja en ambiente seco.'],
    images: [
      '/images/products/console-gb-dmg.jpg',
      '/images/products/console-box-gb.jpg'
    ],
    trailer_url: 'https://www.youtube.com/watch?v=e7wP0f4vT3Q',
    purchase_options: [ 'Juego completo', 'Solo cartucho', 'Caja', 'Manual (completo)', 'Parte interior del manual (separada)' ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Super Nintendo PAL original',
    slug: 'super-nintendo-pal-original',
    price: 6900,
    status: 'used',
    stock: 8,
    category_id: 'cat-1',
    description: 'Consola SNES PAL con estado coleccionista.',
    long_description: 'Unidad de Super Nintendo PAL orientada a colección y setup retro.',
    curiosities: ['Plataforma clave de 16 bits para catálogo Nintendo.'],
    tips: ['Mantén conectores limpios y ventilación libre de polvo.'],
    images: [
      '/images/products/console-snes-pal.jpg',
      '/images/products/special-editions/console-special-snes-jr.jpg'
    ],
    trailer_url: 'https://www.youtube.com/watch?v=Gmpx4MjQxU4',
    purchase_options: [
      'Juego completo',
      'Solo cartucho',
      'Caja',
      'Manual (completo)',
      'Parte interior del manual (separada)'
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Caja Mystery Premium',
    slug: 'mystery-premium',
    price: 9900,
    status: 'new',
    stock: 12,
    category_id: 'cat-3',
    description: 'Selección curada de piezas sorpresa.',
    long_description: 'Incluye una rareza garantizada y extras premium.',
    curiosities: ['La selección cambia cada mes.'],
    tips: ['Ideal para regalar.'],
    images: [
      '/images/mystery-box-5.png',
      '/images/hype/mystery-drop.svg'
    ],
    trailer_url: 'https://www.youtube.com/watch?v=6M6samPEMpM',
    purchase_options: [ 'Juego completo', 'Solo cartucho', 'Caja', 'Manual (completo)', 'Parte interior del manual (separada)' ],
    created_at: new Date().toISOString(),
  },
];
