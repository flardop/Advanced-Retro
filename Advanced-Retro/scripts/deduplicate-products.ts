/**
 * Deduplica productos en Supabase.
 *
 * Uso:
 *   npx tsx scripts/deduplicate-products.ts           # simulación
 *   npx tsx scripts/deduplicate-products.ts --apply   # aplicar cambios
 */

import { createClient } from '@supabase/supabase-js';
import { deduplicateProducts } from '../lib/adminProductCleanup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const maxGroupsArg = process.argv.find((arg) => arg.startsWith('--max='));
const maxGroups = maxGroupsArg ? Number(maxGroupsArg.split('=')[1]) : 250;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log(`Modo: ${apply ? 'APPLY' : 'DRY RUN'} | maxGroups=${maxGroups}`);
  const result = await deduplicateProducts(supabaseAdmin, { apply, maxGroups });

  console.log('\nResumen:');
  console.log(`- Grupos detectados: ${result.groupsFound}`);
  console.log(`- Grupos aplicados: ${result.groupsApplied}`);
  console.log(`- Productos eliminados: ${result.productsRemoved}`);
  console.log(`- Order items re-asignados: ${result.orderItemsRepointed}`);

  if (result.previews.length > 0) {
    console.log('\nPreview (primeros 20 grupos):');
    for (const group of result.previews.slice(0, 20)) {
      console.log(
        `- ${group.normalizedName} | keep=${group.keepId} | remove=${group.duplicateIds.join(', ')} | stock=${group.totalMergedStock}`
      );
    }
  }

  if (result.errors.length > 0) {
    console.log('\nErrores:');
    for (const err of result.errors) {
      console.log(`- ${err}`);
    }
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
