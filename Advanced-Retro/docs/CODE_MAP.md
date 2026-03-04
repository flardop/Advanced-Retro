# Advanced Retro - Mapa del Código

Documento rápido para saber dónde tocar cada funcionalidad sin perder tiempo.

## 1) Pagos y comisiones

- `app/api/orders/route.ts`
  - Crea pedido normal de tienda.
  - Calcula envío, cupón y comisión.
  - Crea Checkout Session de Stripe.
- `app/api/mystery/checkout/route.ts`
  - Crea pedido de tirada Mystery Box.
  - Calcula comisión de mystery.
  - Crea Checkout Session de Stripe.
- `app/api/stripe/webhook/route.ts`
  - Confirma eventos de Stripe (`checkout.session.completed`).
  - Guarda `payment_intent`, `charge`, comisión y moneda en `orders`.
  - Dispara liquidación del pedido.
- `lib/commissions.ts`
  - Motor central de comisiones.
  - Lee porcentajes desde variables de entorno.
- `lib/orderSettlement.ts`
  - Lógica de negocio post-pago:
  - stock, estado paid, tickets, cupones, XP, email.

## 2) Producto (ficha, imágenes, vídeo, social)

- `components/sections/ProductDetail.tsx`
  - Vista principal de producto.
  - Galería, variantes/pack, carrito, precio mercado, valoraciones y favoritos.
  - Vídeo opcional por `trailer_url` (carga diferida).
- `lib/videoEmbed.ts`
  - Parser de URL YouTube/Vimeo para embebido seguro.
- `app/api/products/[id]/price-history/route.ts`
  - Histórico de precio de producto + overlay de mercado.
- `app/api/products/[id]/social/route.ts`
  - Visitas, favoritos y reseñas.

## 3) Comunidad (anuncios de usuarios)

- `lib/userListings.ts`
  - Validación, creación y lectura de anuncios.
  - Comisión de comunidad y lógica de ranking/perfil vendedor.
- `app/api/profile/listings/route.ts`
  - CRUD de anuncios desde el perfil del usuario.
- `app/api/admin/listings/*`
  - Revisión/admin de anuncios y gestión de entrega.
- `lib/wallet.ts`
  - Saldo interno y abonos por venta de comunidad entregada.

## 4) Perfil, gamificación y wallet

- `components/sections/ProfileView.tsx`
  - Interfaz del perfil.
- `lib/gamification.ts`
  - Reglas de XP, niveles y configuración visual.
- `lib/gamificationServer.ts`
  - Aplicación de XP/logros desde backend.
- `app/api/wallet/*`
  - API de cartera y retiradas.

## 5) Mercado externo (eBay)

- `lib/ebayBrowse.ts`
  - Cliente y normalización de comparables eBay.
- `app/api/market/ebay-price/route.ts`
  - Endpoint principal de comparación de precio.
- `app/api/market/ebay-diagnostic/route.ts`
  - Diagnóstico de credenciales/modo/scope/resultados.

## 6) Administración

- `components/sections/AdminPanel.tsx`
  - Vista de administración.
- `app/api/admin/*`
  - Endpoints de gestión (productos, pedidos, comunidad, wallets, métricas).

## 7) SQL / Migraciones importantes

- `database/master_supabase_setup.sql`
  - Setup principal y compatible con esquemas legacy.
- `database/stripe_commissions_upgrade.sql`
  - Columnas de comisión y trazabilidad Stripe en `orders`.
- `database/product_video_support.sql`
  - Columna `products.trailer_url`.
- `database/community_marketplace_upgrade.sql`
  - Upgrade del marketplace de comunidad.

## 8) Variables de entorno clave

- Stripe:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Comisiones:
  - `STORE_COMMISSION_RATE_PERCENT`
  - `STORE_COMMISSION_RATE_CATALOG_PERCENT`
  - `STORE_COMMISSION_RATE_MYSTERY_PERCENT`
  - `STORE_COMMISSION_RATE_COMMUNITY_PERCENT`
- Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

