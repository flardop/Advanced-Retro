# Setup Supabase

1. Crear proyecto en Supabase.
2. Ejecutar `database/schema.sql` en SQL Editor.
3. En Authentication:
   - Activar Email/Password.
   - Activar "Confirm email" si quieres que los usuarios confirmen por correo (recomendado).
   - En **URL Configuration**:
     - **Site URL**: tu URL pública (ej. `https://tudominio.com` o en local `http://localhost:3007`).
     - **Redirect URLs**: añadir `http://localhost:3007/auth/callback` y tu URL de producción `https://tudominio.com/auth/callback`.
   - Activar Google y Apple (OAuth).
4. En Storage:
   - Crear bucket `product-images` (public).
5. Copiar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Copiar `SUPABASE_SERVICE_ROLE_KEY`.
7. En `.env.local` definir `NEXT_PUBLIC_SITE_URL` (ej. `http://localhost:3007`) para que los enlaces de confirmación apunten a tu sitio.
