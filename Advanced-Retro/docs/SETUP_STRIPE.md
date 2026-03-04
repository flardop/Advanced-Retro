# Setup Stripe

1. Crear cuenta Stripe y activar modo test.
2. Copiar `STRIPE_SECRET_KEY`.
3. Crear webhook en Stripe:
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`
4. Copiar `STRIPE_WEBHOOK_SECRET`.
5. Agregar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
6. (Opcional) Configurar comisiones en entorno:
   - `STORE_COMMISSION_RATE_PERCENT=5`
   - `STORE_COMMISSION_RATE_CATALOG_PERCENT` (si quieres distinto para tienda)
   - `STORE_COMMISSION_RATE_MYSTERY_PERCENT` (si quieres distinto para mystery)
7. Ejecutar en Supabase SQL Editor:
   - `database/stripe_commissions_upgrade.sql`
