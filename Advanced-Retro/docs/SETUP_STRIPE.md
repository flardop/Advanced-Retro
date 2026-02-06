# Setup Stripe

1. Crear cuenta Stripe y activar modo test.
2. Copiar `STRIPE_SECRET_KEY`.
3. Crear webhook en Stripe:
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`
4. Copiar `STRIPE_WEBHOOK_SECRET`.
5. Agregar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
