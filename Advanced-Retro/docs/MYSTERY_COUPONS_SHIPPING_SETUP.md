# Mystery Box + Cupones + Envíos + Emails

## 1) SQL obligatorio
En Supabase SQL Editor ejecuta:

- `database/mystery_roulette_bootstrap.sql` (rápido: crea ruleta + premios + tickets + cupones)
- `database/admin_chat_seller_features.sql` (si aún no está)
- `database/commerce_upgrade_mystery_shipping_coupons.sql`
- Opcional catálogo extra: `database/seed_platforms_and_consoles.sql`

Si ves el error:

- `Could not find the table 'public.mystery_boxes' in the schema cache`

ejecuta primero `database/mystery_roulette_bootstrap.sql`, espera 10-20 segundos y recarga.

## 2) Variables de entorno (Vercel)
Configura en **Production/Preview/Development**:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Para emails (Nominalia SMTP):

- `SMTP_HOST`
- `SMTP_PORT` (587 o 465)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (ej: `admin@advancedretro.es`)

## 3) Webhook Stripe
Endpoint recomendado:

- `https://advancedretro.es/api/stripe/webhook`

Eventos mínimos:

- `checkout.session.completed`

## 4) Mystery box
- Página: `/ruleta`
- Compra ticket por Stripe.
- Tras pago, se crea ticket de tirada.
- El spin consume ticket y guarda premio.
- Si premio es cupón, se genera código único de un uso.

Regla implementada:
- Los tickets se comparten por **mismo precio de caja**.
- Ticket de 5€ no sirve para caja de 10€.

## 5) Cupones
- Admin: pestaña `COUPONS` en `/admin`.
- Tipos: `percent`, `fixed`, `free_order`.
- Se registra redención y no se reutilizan cuando llegan a su límite.

## 6) Envíos admin
- Admin: pestaña `SHIPPING` en `/admin`.
- Botón para generar etiqueta PDF por pedido.
- Campo de tracking editable.
- Cambio de estado de pedido envía email al cliente (si SMTP configurado).

## 7) Deduplicación de productos
- Admin: en pestaña `PRODUCTS` usa `Preview duplicados` y `Limpiar duplicados`.
- CLI opcional:
  - `npm run products:dedupe` (simulación)
  - `npm run products:dedupe -- --apply` (aplicar)
