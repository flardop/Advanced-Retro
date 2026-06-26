export type RetrovilleCharacterStatus = 'render-final' | 'incoming';

export type RetrovilleCharacter = {
  name: string;
  role: string;
  inspiration: string;
  district: string;
  status: RetrovilleCharacterStatus;
  image?: string;
  description: string;
  chips: readonly string[];
  reviewExpansion?: boolean;
};

export type RetrovilleEpisode = {
  number: number;
  title: string;
  description: string;
  characters: readonly string[];
};

export type RetrovilleGuideSlide = {
  title: string;
  meta: string;
  image: string;
  alt: string;
};

export function toRetrovilleAnchor(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const retrovilleMainCharacters: readonly RetrovilleCharacter[] = [
  {
    name: 'NOX',
    role: 'Protagonista principal y ancla emocional',
    inspiration: 'Memoria RAM fragmentada convertida en núcleo digital',
    district: 'Console Core',
    status: 'render-final',
    image: '/images/retroville/nox-character-large.webp',
    description:
      'NOX es el centro emocional de Retroville: cansado, sarcástico y más sensible de lo que quiere admitir. No es un héroe limpio; sobrevive porque no le queda otra.',
    chips: ['Batería baja', 'Humor seco', 'Lealtad escondida'],
  },
  {
    name: 'LUNA',
    role: 'Presencia magnética que convierte la atención en poder',
    inspiration: 'Controller con glamour tóxico y lectura social afilada',
    district: 'Top Slot',
    status: 'render-final',
    image: '/images/retroville/luna-character-large.webp',
    description:
      'Luna entra con glamour, manipulación y una sonrisa que nunca sabes si ayuda o complica. No busca amor: busca atención, control y una grieta emocional que siempre acaba moviendo la escena.',
    chips: ['Glamour tóxico', 'Control', 'Caos elegante'],
  },
  {
    name: 'BUTTON CREW',
    role: 'Pandilla central que convierte el barrio en conflicto permanente',
    inspiration: 'Botones A / B / Y / X elevados a colectivo social',
    district: 'Power Plaza',
    status: 'render-final',
    image: '/images/retroville/button-crew-character-large.webp',
    description:
      'A, B, Y y X funcionan como una pequeña pandilla de impulsos: discuten, empujan la escena y convierten cualquier situación sencilla en un problema comunitario.',
    chips: ['A / B / Y / X', 'Ruido de grupo', 'Energía callejera'],
  },
] as const;

export const retrovilleSecondaryCharacters: readonly RetrovilleCharacter[] = [
  {
    name: 'NORA',
    role: 'Vecina que lo ve todo antes que nadie',
    inspiration: 'Figura vecinal de barrio convertida en memoria social',
    district: 'Riverside District',
    status: 'render-final',
    image: '/images/retroville/characters/nora.webp',
    description:
      'Nora lleva más tiempo en Retroville que casi cualquiera. Observa, juzga y sabe demasiado sobre todos. No crea caos: lo archiva y luego lo comenta mejor que nadie.',
    chips: ['Observadora', 'Tradicional', 'Secretos del barrio'],
  },
  {
    name: 'JOY & GRUMP',
    role: 'Vecinos de pesadilla y motor de sitcom amarga',
    inspiration: 'Joy-cons retirados atrapados en rutina y quejas',
    district: 'Memory Leak Lane',
    status: 'render-final',
    image: '/images/retroville/characters/joy-grump.webp',
    description:
      'Dos joy-cons retirados que viven puerta con puerta y no soportan absolutamente nada. Quejas, rutina y cero paciencia como motor cómico.',
    chips: ['0% paciencia', 'Quejas vecinales', 'Sitcom amarga'],
  },
  {
    name: 'SHIFT STICK',
    role: 'Operador de tránsito y cara del absurdo burocrático',
    inspiration: 'Palanca de cambio llevada al sistema urbano',
    district: 'Central Station',
    status: 'render-final',
    image: '/images/retroville/characters/crux.webp',
    description:
      'Funcionario veterano del sistema urbano. Todo pasa por formularios, llaves y una mirada que ya no espera nada de nadie.',
    chips: ['Administración', 'Llaves', 'Orden viejo'],
  },
  {
    name: 'TRIMP',
    role: 'Competidor que entra en escena como si siempre fuera suya',
    inspiration: 'Motion controller con ego de showman',
    district: 'Playfield Complex',
    status: 'render-final',
    image: '/images/retroville/characters/trimp.webp',
    description:
      'TRIMP no sigue el juego: intenta poner las reglas. Competitivo, dominante y demasiado convencido de que la cámara siempre le pertenece.',
    chips: ['Ego alto', 'Competitivo', 'Showman'],
  },
  {
    name: 'MAYOR TUBE',
    role: 'Alcalde y cara institucional del relato',
    inspiration: 'Pantalla pública convertida en autoridad sonriente',
    district: 'City Hall / Power Plaza',
    status: 'render-final',
    image: '/images/retroville/characters/mayor-tube.webp',
    description:
      'El poder con sonrisa de pantalla. Mayor Tube promete control, progreso y una ciudad perfectamente encendida aunque nadie haya preguntado.',
    chips: ['Diplomático', 'Orden oficial', 'Bajo control'],
  },
  {
    name: 'MIA',
    role: 'Influencer que convierte la tensión en contenido',
    inspiration: 'Cámara frontal y cultura social como moneda',
    district: 'Broadcast Row',
    status: 'render-final',
    image: '/images/retroville/characters/influencer.webp',
    description:
      'Brillo, filtros, cámara frontal y una habilidad natural para convertir cualquier crisis en contenido. En Retroville, la atención también es moneda.',
    chips: ['Selfie mode', 'Glamour', 'Atención'],
  },
  {
    name: 'TOMO',
    role: 'Kid de barrio con energía de travesura constante',
    inspiration: 'Infancia arcade y energía de patio pixelado',
    district: 'Pixel Park',
    status: 'render-final',
    image: '/images/retroville/characters/tomo.webp',
    description:
      'Niño de barrio, chupa-chups, gorra ladeada y energía de travesura. Sabe demasiados atajos y cree que todo le queda bien.',
    chips: ['Travieso', 'Main character energy', 'Atajos'],
  },
  {
    name: 'PIPO',
    role: 'Molestia pequeña con ego enorme',
    inspiration: 'Virtual pet llevado a caos cotidiano',
    district: 'Glitch Market',
    status: 'render-final',
    image: '/images/retroville/characters/pipo.webp',
    description:
      'Pipo es pequeño, molesto y convencido de que nada es culpa suya. Virtual pet con ego desproporcionado y sonrisa de problema.',
    chips: ['No es su culpa', 'Lollipop', 'Ego level 100'],
  },
  {
    name: 'NANO',
    role: 'Niño silencioso que baja el volumen del ruido ajeno',
    inspiration: 'Pocket MP3 player obsesionado con su playlist',
    district: 'Sound Alley',
    status: 'render-final',
    image: '/images/retroville/characters/nano.webp',
    description:
      'Nano vive dentro de su playlist. Más callado, más sensible y más perdido en música que el resto de la ciudad.',
    chips: ['Música', 'Daydreaming', 'Batería baja'],
  },
] as const;

export const retrovilleIncomingCharacters: readonly RetrovilleCharacter[] = [
  {
    name: 'LA PROFESORA / NONA',
    role: 'Figura del colegio que abre la cara más inquietante de la ciudad',
    inspiration: 'Base visual por confirmar en desarrollo',
    district: 'Colegio de Retroville',
    status: 'incoming',
    description:
      'En el colegio de Retroville, en público parece encantadora; en privado abre una grieta mucho más oscura. Su entrada cambia la lectura de lo que parece la ciudad y lo que realmente es.',
    chips: ['Colegio', 'Doble cara', 'Incoming'],
    reviewExpansion: true,
  },
  {
    name: 'JOW & ANDREW',
    role: 'Dúo íntimo que baja el ruido del universo',
    inspiration: 'Cassette romántico + reproductor portátil',
    district: 'Riverside District',
    status: 'incoming',
    image: '/images/retroville/characters/jow-andrew.webp',
    description:
      'Una pieza más cálida dentro del universo: nostalgia, afecto y diseño de personajes pensado para escenas que bajan el ruido y dejan espacio a vínculo real.',
    chips: ['Pareja', 'Cinta + música', 'Tono humano'],
    reviewExpansion: true,
  },
  {
    name: 'LA MAFIA',
    role: 'Facción de presión que endurece el conflicto de barrio',
    inspiration: 'Bloques de puzzle llevados a jerarquía criminal',
    district: 'Cartridge Quarter',
    status: 'incoming',
    image: '/images/retroville/characters/retroville-mafia.webp',
    description:
      'No todo el caos de la ciudad es espontáneo. Esta facción empuja jerarquías, barrio, amenaza y presencia visual más dura para equilibrar el tono cómico con tensión real.',
    chips: ['Poder local', 'Presión grupal', 'Barrio caliente'],
    reviewExpansion: true,
  },
] as const;

export const retrovilleEpisodes: readonly RetrovilleEpisode[] = [
  {
    number: 1,
    title: 'Llegada',
    description:
      'NOX aparece en Retroville sin saber dónde está ni qué espera de él. Primer día en la ciudad: busca dónde quedarse, se pierde en el barrio, conoce el RAM District y se topa con Joy & Grump, sus vecinos de pesadilla.',
    characters: ['NOX', 'Joy & Grump'],
  },
  {
    number: 2,
    title: 'El barrio',
    description:
      'NOX intenta integrarse en el RAM District. Conoce a Nora, que le da de comer a la fuerza y le cuenta todos los cotilleos del barrio. Primer encuentro con Shift Stick en el ayuntamiento por un problema burocrático absurdo. Los Button Crew le lían en algo sin pedirle permiso.',
    characters: ['NOX', 'Nora', 'Shift Stick', 'Button Crew'],
  },
  {
    number: 3,
    title: 'Trabajo',
    description:
      'NOX necesita dinero. Busca trabajo y acaba en el puesto de comida rápida donde trabaja Luna. Primer encuentro entre los dos. Trimp aparece a buscarla y hay tensión inmediata.',
    characters: ['NOX', 'Luna', 'Trimp'],
  },
  {
    number: 4,
    title: 'La noche',
    description:
      'Los Button Crew llevan a NOX a Top Slot por primera vez. Mia lo graba todo. Luna está por ahí. NOX empieza a entender que la ciudad tiene capas que no había visto desde el barrio.',
    characters: ['NOX', 'Button Crew', 'Mia', 'Luna'],
  },
  {
    number: 5,
    title: 'El Desguace',
    description:
      'Alguien menciona el Desguace en serio por primera vez. El Botón Y tiene un problema grave con la Mafia que empieza a afectar al grupo. Primera señal de que hay algo peligroso debajo del día a día.',
    characters: ['NOX', 'Botón Y', 'Mafia'],
  },
  {
    number: 6,
    title: 'Nona',
    description:
      'NOX conoce a Nona en el colegio de Retroville. En público le parece encantadora. En privado descubre su lado oscuro. Primera grieta entre lo que parece la ciudad y lo que realmente es.',
    characters: ['NOX', 'Nona', 'Tomo', 'Pipo'],
  },
  {
    number: 7,
    title: 'Ruptura',
    description:
      'Trimp y Luna rompen por culpa de él. Retroville entera se entera antes que NOX. Mia empieza a maniobrar para aprovechar la situación.',
    characters: ['Luna', 'Trimp', 'Mia', 'NOX'],
  },
  {
    number: 8,
    title: 'Bit Grave',
    description:
      'NOX acaba en Bit Grave por primera vez, siguiendo al Botón Y en su problema con la Mafia. La amenaza del Desguace se hace concreta. Alguien que conoce está en riesgo real.',
    characters: ['NOX', 'Botón Y', 'Mafia'],
  },
  {
    number: 9,
    title: 'Reconocimiento',
    description:
      'NOX toma una decisión pública sin filtro ni cálculo. Por primera vez Retroville le ve de verdad. Consecuencias buenas y malas simultáneamente.',
    characters: ['NOX', 'Reparto completo'],
  },
  {
    number: 10,
    title: 'Cierre T1',
    description:
      'El problema de la Mafia llega a su punto más álgido. Varios personajes definen quiénes son. NOX ya no es el recién llegado. No todo se resuelve, queda suficiente abierto para la T2.',
    characters: ['Reparto completo', 'Mafia'],
  },
] as const;

export const retrovilleSeasonTwoTease = {
  label: 'Incoming',
  title: 'Temporada 2',
  description:
    'La siguiente fase queda separada como incoming, sin spoilers ni falsas promesas. Solo se deja claro que la ciudad ya no podrá volver al punto de partida.',
} as const;

export const retrovilleGuideSlides: readonly RetrovilleGuideSlide[] = [
  {
    title: 'NOX styleguide',
    meta: 'Guía final',
    image: '/images/retroville/nox-styleguide.png',
    alt: 'Guía visual de NOX con pose, silueta y acabado final',
  },
  {
    title: 'LUNA styleguide',
    meta: 'Guía final',
    image: '/images/retroville/luna-styleguide.png',
    alt: 'Guía visual de Luna con pose, acabado y presencia del personaje',
  },
  {
    title: 'BUTTON CREW guide',
    meta: 'Guía final',
    image: '/images/retroville/button-crew-styleguide.webp',
    alt: 'Guía visual del Button Crew con personalidad, grupo y acabado final',
  },
  {
    title: 'Cast anatomy',
    meta: 'Archivo base',
    image: '/images/retroville/characters/character-anatomy-sheet.webp',
    alt: 'Hoja de anatomía del reparto principal de Retroville',
  },
  {
    title: 'Nora v2',
    meta: 'Dev sheet',
    image: '/images/retroville/dev-characters/nora-v2-sheet.png',
    alt: 'Hoja de desarrollo de Nora con nueva iteración del personaje',
  },
  {
    title: 'Joy & Grump',
    meta: 'Dev sheet',
    image: '/images/retroville/dev-characters/joy-grump-sheet.png',
    alt: 'Hoja de desarrollo de Joy y Grump con poses y construcción del dúo',
  },
  {
    title: 'Shift Stick',
    meta: 'Dev sheet',
    image: '/images/retroville/dev-characters/shift-stick-sheet.png',
    alt: 'Hoja de desarrollo de Shift Stick como operador de tránsito de Retroville',
  },
  {
    title: 'Trimp v2',
    meta: 'Revisión',
    image: '/images/retroville/dev-characters/trimp-v2-sheet.png',
    alt: 'Revisión visual de Trimp con nueva iteración del personaje',
  },
  {
    title: 'Jow & Andrew',
    meta: 'Incoming',
    image: '/images/retroville/characters/jow-andrew.webp',
    alt: 'Render de Jow y Andrew como pareja en desarrollo dentro de Retroville',
  },
  {
    title: 'La Mafia',
    meta: 'Incoming',
    image: '/images/retroville/characters/retroville-mafia.webp',
    alt: 'Render de la Mafia de Retroville como facción social en desarrollo',
  },
] as const;
