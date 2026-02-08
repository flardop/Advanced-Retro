/**
 * Test RAWG API (gratuito, sin autenticación)
 * Busca covers para 5 juegos de muestra
 */

const GAMES = [
  'Pokemon Red',
  'Super Mario Land',
  'Tetris',
  'Metroid II',
  'The Legend of Zelda',
];

async function searchRAWG(gameName: string): Promise<{
  game: string;
  found: boolean;
  imageUrl?: string;
} | null> {
  try {
    console.log(`🔍 Buscando: "${gameName}"`);

    // Aumentar timeout a 15 segundos (RAWG puede ser lento)
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&page_size=1`
    );

    if (!response.ok) {
      console.log(`⚠️  Error RAWG: ${response.status}`);
      return { game: gameName, found: false };
    }

    const data = (await response.json()) as any;
    const games = data.results || [];

    if (games.length === 0) {
      console.log(`❌ No encontrado en RAWG`);
      return { game: gameName, found: false };
    }

    const foundGame = games[0];
    const imageUrl = foundGame.background_image;

    if (!imageUrl) {
      console.log(
        `⚠️  Juego encontrado ("${foundGame.name}") pero sin imagen`
      );
      return { game: gameName, found: false };
    }

    console.log(`✅ Imagen encontrada: ${imageUrl}`);
    return { game: gameName, found: true, imageUrl };
  } catch (error) {
    console.error(`❌ Error:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function main() {
  console.log('📊 CONSULTANDO RAWG API PARA 5 JUEGOS');
  console.log('=====================================\n');

  const results: Array<{
    game: string;
    found: boolean;
    imageUrl?: string;
  }> = [];

  for (const gameName of GAMES) {
    const result = await searchRAWG(gameName);
    if (result) {
      results.push(result);
    }
    console.log('');
    // Rate limit: RAWG allows generous requests (>60/min)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n📊 RESUMEN DE RESULTADOS');
  console.log('======================');
  results.forEach(({ game, found, imageUrl }) => {
    if (found) {
      console.log(`✅ ${game}`);
      console.log(`   ${imageUrl}`);
    } else {
      console.log(`❌ ${game}: sin imagen`);
    }
  });

  const found = results.filter((r) => r.found).length;
  console.log(`\n📈 Total: ${found}/${GAMES.length} juegos con imagen encontrada`);
}

main();
