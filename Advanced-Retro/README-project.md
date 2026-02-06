# ADVANCED RETRO — Premium Retro E-commerce

## Requisitos
- Node 18+
- Cuenta Supabase
- Cuenta Stripe

## Setup Supabase
1. Crea un proyecto en Supabase.
2. En SQL Editor ejecuta `database/schema.sql`.
3. Crea categorías y productos desde el panel Admin o con INSERTs.
4. Activa Auth Providers (Email, Google, Apple).

## Setup Stripe
1. Crea una cuenta Stripe.
2. Obtén `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
3. En Stripe crea un webhook a `/api/stripe/webhook`.

## Variables de entorno
Duplica `.env.example` a `.env.local` y completa:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Ejecutar
```bash
npm install
npm run dev
```

## Deploy en Vercel
1. Importa el repo en Vercel.
2. Configura variables de entorno en Vercel.
3. Deploy.

## Flujo de compra
1. Usuario añade producto al carrito.
2. Checkout crea orden y redirige a Stripe.
3. Webhook marca la orden como `paid`.

## Administración
Ruta: `/admin`
Funciones:
- CRUD productos
- Gestión pedidos
- Gestión usuarios

## Estructura
- `/app` rutas y páginas
- `/components` UI
- `/lib` clientes y helpers
- `/database` esquema y RLS
