/**
 * Script para crear el usuario administrador en Supabase
 *
 * Uso (una sola vez):
 *   npx tsx scripts/create-admin-user.ts
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Cargar .env.local (Node no lo carga al ejecutar el script)
function loadEnvLocal() {
  const paths = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '..', '.env.local'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf-8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) {
          const key = m[1].trim();
          const val = m[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
      return;
    }
  }
}
loadEnvLocal();

const ADMIN_EMAIL = 'joel@admin.com';
const ADMIN_PASSWORD = 'Polo4455@4455';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdminUser() {
  console.log('🔐 Creando usuario administrador...');

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message?.includes('already been registered') || createError.message?.toLowerCase().includes('already exists')) {
      console.log('⚠️  El usuario ya existe. Actualizando rol a admin...');
    } else {
      console.error('❌ Error creando usuario:', createError.message);
      process.exit(1);
    }
  } else if (userData?.user) {
    console.log('✅ Usuario creado en Auth:', userData.user.id);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', ADMIN_EMAIL);

  if (updateError) {
    console.error('❌ Error actualizando rol:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Rol "admin" asignado a', ADMIN_EMAIL);
  console.log('\n📧 Email:', ADMIN_EMAIL);
  console.log('🔑 Contraseña:', ADMIN_PASSWORD);
  console.log('\nYa puedes iniciar sesión en la web con este usuario.');
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
