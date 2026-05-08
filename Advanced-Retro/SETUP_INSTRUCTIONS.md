# SETUP INSTRUCTIONS — AdvancedRetro v3.0

## Paso 1: Supabase SQL Editor
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → `SQL Editor`.
2. Abre este archivo local:
   - `/Users/joelrivera/tienda-web/Advanced-Retro/supabase/master_schema.sql`
3. Copia el contenido completo.
4. Pégalo completo en el editor.
5. Ejecuta el script.
6. Si Supabase muestra el aviso de RLS automática, usa `Run without RLS`.
   El script ya activa RLS y crea sus políticas manualmente.

## Paso 2: Supabase Authentication
1. Ve a `Authentication > Settings`.
2. Desactiva `Confirm email`.
   Esto es importante para que el admin pueda entrar directamente con su usuario.
3. En `Site URL` usa:
   - `https://advancedretro.es`
4. En `Redirect URLs` añade:
   - `https://advancedretro.es/auth/callback`
   - `https://advancedretro.es/admin/login`
   - `https://advancedretro.es/admin/dashboard`
   - `http://localhost:3020/auth/callback`
   - `http://localhost:3020/admin/login`

## Paso 3: Crear usuario admin
1. Ve a `Authentication > Users`.
2. Crea este usuario si todavía no existe:
   - Email: `flardop44@gmail.com`
   - Password: `Polo4455@`
3. El propio `master_schema.sql` intenta asignarle rol `admin` en `public.profiles`.
4. Si quieres forzarlo manualmente después del primer login, ejecuta:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where lower(coalesce(email, '')) = 'flardop44@gmail.com';
```

## Paso 4: Supabase Storage
Crea estos buckets en `Storage`:

- `product-images` → `public`
- `avatars` → `public`
- `profile-avatars` → `public`
- `profile-banners` → `public`
- `product-social` → `public`
- `community-listings` → `public`
- `exports` → `private`

## Paso 5: Supabase Realtime
En `Database > Replication > Publications > supabase_realtime`, activa estas tablas si no están ya añadidas:

- `user_sessions`
- `error_logs`
- `page_views`
- `retro_storage_auction_bids`
- `retro_storage_auction_chat_messages`
- `orders`

## Paso 6: Variables de entorno
Copia:
- `/Users/joelrivera/tienda-web/Advanced-Retro/.env.local.example`

como:
- `.env.local`

Variables mínimas necesarias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=https://advancedretro.es
SITE_URL=https://advancedretro.es
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

## Paso 7: Stripe webhook
1. Ve a [Stripe Webhooks](https://dashboard.stripe.com/webhooks).
2. Añade este endpoint:
   - `https://advancedretro.es/api/webhooks/stripe`
3. Escucha estos eventos:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copia el signing secret y guárdalo como `STRIPE_WEBHOOK_SECRET` en Vercel.

## Paso 8: SEO e indexación
### Google Search Console
1. Ve a [Google Search Console](https://search.google.com/search-console).
2. Añade la propiedad `https://advancedretro.es`.
3. Verifica el dominio.
4. Envía este sitemap:
   - `https://advancedretro.es/sitemap.xml`
5. Usa `Inspección de URL` para pedir indexación de:
   - `/`
   - `/tienda`
   - `/retroville`
   - páginas de producto importantes

### Bing Webmaster Tools
1. Ve a [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Añade `https://advancedretro.es`.
3. Verifica la propiedad.
4. Envía:
   - `https://advancedretro.es/sitemap.xml`

Nota:
- Bing alimenta también visibilidad en otros buscadores que reutilizan parte de su índice o señales, pero no significa indexación instantánea.

## Paso 9: Login admin
1. Ve a:
   - `https://advancedretro.es/admin/login`
2. Entra con:
   - `flardop44@gmail.com`
   - `Polo4455@`
3. Revisa:
   - `/admin/dashboard`
   - `/admin/settings`
   - `/admin/products`
   - `/admin/orders`

## Paso 10: Integraciones desde el admin panel
Dentro del panel admin, en `Settings`, completa:

- `ebay_api_key`
- `resend_api_key`
- `admin_alert_email`
- `retroville_launch_date`
- umbral de stock bajo y toggles de alertas

## Paso 11: Retroville
### Preview protegida
- URL: `https://advancedretro.es/dev-retroville`
- Password visual de preview: `test1`

### Teaser público
- URL: `https://advancedretro.es/retroville`

## Verificación final
- [ ] `master_schema.sql` ejecutado sin errores críticos
- [ ] `/admin/login` deja entrar al usuario admin
- [ ] `/admin/dashboard` muestra datos reales
- [ ] `/retroville` carga con countdown y waitlist
- [ ] `/dev-retroville` pide clave y luego muestra la preview
- [ ] las mystery boxes muestran las nuevas imágenes
- [ ] `/sitemap.xml` responde
- [ ] `/robots.txt` responde
- [ ] Stripe webhook configurado
- [ ] Google Search Console y Bing Webmaster con sitemap enviado

## Nota importante sobre Google
Que la web “salga en Google” no significa que todos los cambios nuevos estén ya lanzados e indexados.
Para que un producto o una página nueva aparezcan bien:
1. el deploy tiene que estar en producción
2. el sitemap tiene que estar actualizado
3. Google tiene que volver a rastrear esa URL
4. si quieres acelerar el proceso, usa `Inspección de URL > Solicitar indexación`
