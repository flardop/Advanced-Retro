# AdvancedRetro Admin Panel · Setup Instructions

## 1. SQL a ejecutar en Supabase SQL Editor
Ejecuta este archivo completo en el SQL Editor de Supabase:

- `/Users/joelrivera/tienda-web/Advanced-Retro/supabase/migrations/admin_setup.sql`

Este script crea:
- `profiles`
- `page_views`
- `user_sessions`
- `login_activity_logs`
- `error_logs`
- `email_templates`
- `email_logs`
- `scheduled_emails`
- `admin_settings`
- `retroville_waitlist`
- `store_creator_leads`
- `admin_product_meta`
- `admin_order_meta`
- `admin_order_status_events`
- `admin_message_reviews`
- RLS, policies, triggers, seeds y sync con `auth.users`

También asigna `role = 'admin'` al email `flardop44@gmail.com` dentro de `profiles`.

## 2. Buckets de Supabase Storage a crear manualmente
### Nuevos buckets necesarios para esta entrega
- `admin-product-images` → `public`

Uso:
- imágenes del editor de producto del panel admin

### Buckets ya existentes que el proyecto general puede seguir usando
Si en tu proyecto aún no existen, conviene mantener también estos buckets ya usados por la tienda:
- `profile-avatars` → `public`
- `profile-banners` → `public`
- `community-listings` → `public`
- `product-social` → `public`

## 3. Ajustes de Supabase Auth necesarios
En Supabase Auth:
- Activa `Email/Password` provider
- Asegúrate de que el usuario `flardop44@gmail.com` existe en `auth.users`
- Verifica que el email esté confirmado si vas a usar login directo en `/admin/login`

### URL settings recomendadas
En `Authentication > URL Configuration`:
- Site URL:
  - `https://advancedretro.es`
- Redirect URLs:
  - `https://advancedretro.es/auth/callback`
  - `https://advancedretro.es/admin/login`
  - `http://localhost:3020/auth/callback`
  - `http://localhost:3020/admin/login`

## 4. Variables de entorno necesarias en `.env.local`
Estas son las mínimas para que el panel admin funcione correctamente:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://advancedretro.es
SITE_URL=https://advancedretro.es
```

### Opcionales pero recomendadas
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3020
SITE_URL=http://localhost:3020
```

Notas:
- `SUPABASE_SERVICE_ROLE_KEY` es obligatoria para:
  - crear usuarios desde admin
  - borrar usuarios
  - tracking server-side
  - edición avanzada de catálogo
  - email logs, settings y exports
- `ebay_api_key` y `resend_api_key` no se leen desde `.env.local` en este panel.
  Se guardan en `admin_settings` y se editan desde `/admin/settings`.

## 5. Ajustes de Realtime en Supabase
Para que el feed en vivo y la vista de usuarios online aprovechen suscripciones Realtime, añade estas tablas a la publicación de Realtime:

- `page_views`
- `user_sessions`
- `error_logs`
- `orders`
- `users`

Ruta típica:
- `Database > Replication > Publications > supabase_realtime`

Si no activas Realtime:
- el panel sigue funcionando
- hará fallback a polling automático en varias vistas

## 6. Ajustes operativos después del primer login
Después de entrar en `/admin/login`:
1. Ve a `/admin/settings`
2. Completa:
   - `resend_api_key`
   - `resend_from_email`
   - `admin_alert_email`
   - `ebay_api_key` si quieres la consulta de precios
3. Guarda cambios
4. Prueba:
   - envío de test email desde `/admin/emails/templates/[id]`
   - lead de `/creador-de-tiendas`
   - waitlist de `/retroville`
   - subida de imagen en `/admin/products/new`

## 7. Checklist de despliegue
1. Ejecuta el SQL de `supabase/migrations/admin_setup.sql`
2. Crea el bucket `admin-product-images` en Supabase Storage
3. Verifica que `flardop44@gmail.com` existe en `auth.users`
4. Añade las variables de entorno en local y en producción
5. Despliega la aplicación
6. Accede a:
   - `/admin/login`
   - `/admin/dashboard`
   - `/retroville`
   - `/creador-de-tiendas`
7. Entra en `/admin/settings` y configura claves reales
8. Activa Realtime para las tablas indicadas
9. Prueba estos flujos mínimos:
   - login admin
   - crear producto
   - editar producto
   - actualizar estado de pedido
   - enviar email test
   - registrar waitlist Retroville
   - registrar lead de creador de tiendas
10. Revisa `error_logs` desde `/admin/errors` tras el primer uso

## 8. Rutas nuevas incluidas
### Panel admin
- `/admin/login`
- `/admin/dashboard`
- `/admin/analytics`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/users`
- `/admin/users/[id]`
- `/admin/online`
- `/admin/messages`
- `/admin/emails`
- `/admin/emails/templates`
- `/admin/emails/templates/[id]`
- `/admin/emails/send`
- `/admin/errors`
- `/admin/settings`

### Rutas públicas nuevas
- `/retroville`
- `/creador-de-tiendas`

## 9. Nota técnica importante
El panel está implementado de forma aditiva sobre el proyecto actual:
- no sustituye tablas legacy de tienda
- usa `profiles` como capa administrativa nueva
- mantiene compatibilidad con `public.users` como fallback de rol
- protege `/admin/*` mediante middleware + validación server-side
