# Advanced Retro · Checklist manual (pendiente)

Fecha de referencia: 2026-03-04

Este documento resume **solo lo que debes hacer tú manualmente** en paneles externos (Supabase, Vercel, Stripe, Google, eBay) o SQL Editor.

## 0) Lo que ya dejé hecho yo (no tienes que hacerlo)

- Código sin hardcodes de `vercel.app` en runtime (solo quedan ejemplos en documentación antigua).
- Admin de lanzamientos hype ya implementado:
  - `GET/POST/PUT /api/admin/hype/launches`
  - `GET /api/admin/hype/reservations/export`
- Build local OK y despliegue lanzado vía push:
  - commit: `5f08714`
- Repo protegido para no subir backups locales grandes:
  - `.gitignore` ya incluye `Imagenes_local_backup/`.

---

## 1) Supabase SQL Editor (obligatorio según módulo)

Ejecuta estos scripts en este orden. Todos son idempotentes (si ya existen objetos, no rompen).

### 1.1 Base recomendada

1. `database/master_supabase_setup.sql`
2. `database/security_rls_hardening_public_tables.sql`

### 1.2 Perfil/usuarios (si ves errores de columnas de perfil)

3. `database/profile_columns_hotfix.sql`
4. `database/profile_customization_upgrade.sql`

### 1.3 Soporte/tickets/admin chat

5. `database/admin_chat_seller_features.sql`

### 1.4 Wallet y retiradas

6. `database/internal_wallet_mvp.sql`
7. `database/wallet_withdrawal_requests_mvp.sql`

### 1.5 Social, likes y rendimiento

8. `database/product_likes_auth.sql`
9. `database/performance_social_market_cache.sql`

### 1.6 Mystery/ruleta/hype

10. `database/mystery_roulette_bootstrap.sql`
11. `database/hype_future_launches.sql`

### 1.7 Extras que ya están en la app

12. `database/snake_404_leaderboard.sql`
13. `database/stripe_commissions_upgrade.sql`

> Si en alguna API vuelve a salir "Falta configurar ... Ejecuta database/...", ejecuta justo ese script y recarga.

---

## 2) Vercel (obligatorio)

En **Project Settings → Environment Variables** (Production/Preview):

- `NEXT_PUBLIC_SITE_URL=https://advancedretro.es`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`

Para eBay (si quieres comparativa activa):

- `EBAY_CLIENT_ID=...`
- `EBAY_CLIENT_SECRET=...`
- `EBAY_MARKETPLACE_ID=EBAY_ES`
- `EBAY_USE_SANDBOX=false`

Opcional SEO/analytics:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...`

### Dominio canónico

- En Vercel Domains, deja **Primary Domain** en `advancedretro.es`.
- Redirección 301 de `www.advancedretro.es` → `advancedretro.es` (o al revés, pero uno solo).

---

## 3) Supabase Auth + Google OAuth (obligatorio para login social)

En Supabase:

- **Auth → URL Configuration**
  - Site URL: `https://advancedretro.es`
  - Redirect URLs:
    - `https://advancedretro.es/auth/callback`
    - (si usas preview) añade también la preview específica necesaria.

- **Auth → Providers → Google**
  - Activado con tu Client ID/Secret de Google.

En Google Cloud OAuth Client:

- Authorized redirect URI:
  - `https://darrmonhygphreshbplz.supabase.co/auth/v1/callback`
- Authorized JavaScript origin:
  - `https://advancedretro.es`

### Nota importante (pantalla de Google con dominio supabase.co)

Que Google muestre `...supabase.co` en el "continue to ..." es normal con callback estándar de Supabase.
Solo cambia si configuras **custom auth domain** en Supabase (feature de infraestructura).

---

## 4) Stripe (obligatorio para cobro real)

En Stripe Dashboard → Webhooks:

- Endpoint: `https://advancedretro.es/api/stripe/webhook`
- Eventos mínimos:
  - `checkout.session.completed`
  - `payment_intent.succeeded` (si lo usas en flujos extra)
- Copia el secret `whsec_...` en Vercel como `STRIPE_WEBHOOK_SECRET`.

Verificación rápida:

- Hacer compra test.
- Revisar en Stripe que webhook responde 2xx.
- Revisar en app que el pedido queda pagado y stock descuenta.

---

## 5) eBay API (si quieres precios de mercado en producción)

Ya validado a nivel de código. Te queda solo configuración de cuenta/plataforma:

1. En eBay Developer, usar keyset de **Production** (no SBX).
2. Si sale "keyset disabled / non compliant", completar Account Deletion Notification o solicitar exemption.
3. Variables en Vercel (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_USE_SANDBOX=false`).
4. Re-deploy.
5. Comprobar:
   - `/api/market/ebay-diagnostic?q=pokemon yellow game boy`
   - Debe devolver `"ok": true` y `searchTest.available: true`.

---

## 6) Comprobación final (manual, 10 minutos)

1. Login Google desde móvil y desktop.
2. Crear pedido completo con Stripe test.
3. Revisar webhook en Stripe.
4. Abrir `/admin` y comprobar:
   - exports,
   - wallet/withdrawals,
   - mystery,
   - hype launches.
5. Abrir `/ruleta`, `/subastas`, `/comunidad/publicar`, `/producto/[slug]`.
6. Verificar que likes/favoritos persisten tras recarga.

---

## 7) Riesgos si no ejecutas esta checklist

- Errores "table not found / setupRequired" en módulos nuevos.
- Login social inestable por redirect mismatch.
- Cobros OK pero sin confirmación de webhook.
- Features admin visibles pero sin datos por tablas faltantes.

---

## 8) Orden mínimo recomendado (rápido)

Si quieres ir a lo mínimo operativo en 30-40 min:

1. Variables Vercel (sección 2).
2. Supabase Auth + Google (sección 3).
3. Stripe webhook + secret (sección 4).
4. SQL Editor: scripts 1, 5, 6, 7, 8, 10, 11.
5. Re-deploy y test final (sección 6).
