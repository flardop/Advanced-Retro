import { getBestGameImage } from '../lib/gameImages';

async function run() {
  const tests = [
    'Pokémon Red',
    'Super Mario Land',
    'Metroid II',
    'The Legend of Zelda: Link\'s Awakening',
    'Nonexistent Unk Game 12345',
  ];

  for (const name of tests) {
    try {
      console.log(`\n🔎 Buscando imagen para: ${name}`);
      const url = await getBestGameImage(name, 'game-boy-color');
      console.log(`→ Resultado: ${url}`);
    } catch (err) {
      console.error('Error buscando imagen para', name, err);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
