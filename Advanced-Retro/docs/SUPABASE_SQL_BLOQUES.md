# Supabase SQL por Bloques (Advanced Retro)

## Qué significa el email de Supabase
El aviso que te llegó ("10 errors") suele indicar que hay tablas en `public` sin RLS activado (`RLS Disabled in Public`).

No significa necesariamente hackeo activo: es un aviso de endurecimiento de seguridad pendiente.

---

## Opción A (recomendada): ejecutar por bloques

### Bloque 1: Core completo (schema + RLS + políticas base)
Ejecuta entero:

- `database/master_supabase_setup.sql`

Este bloque ya cubre la mayoría del proyecto y suele resolver los errores de Security Advisor.

### Bloque 2: Endurecimiento de seguridad (si aún ves avisos)
Ejecuta:

- `database/security_rls_hardening_public_tables.sql`

Este bloque está centrado en corregir exactamente "RLS Disabled in Public".

### Bloque 3: Extras funcionales (opcional, pero recomendado)
Ejecuta estos scripts en este orden:

1. `database/stripe_commissions_upgrade.sql`
2. `database/community_publish_listing_extras.sql`
3. `database/hype_future_launches.sql`
4. `database/snake_404_leaderboard.sql`
5. `database/ebay_product_market_overrides.sql`

### Bloque 4: Seeds de catálogo y actividad (opcionales)
Ejecuta solo si quieres cargar contenido/actividad semilla:

1. `database/seed_consolas_real_images.sql`
2. `database/seed_consolas_ediciones_especiales.sql`
3. `database/seed_social_activity_starter.sql`

---

## Opción B: un solo archivo "todo en uno"
Si prefieres pegar una sola vez:

- `database/000_supabase_full_bundle.sql`

Incluye `master` + extras + seeds.

---

## Verificación rápida (copiar/pegar en SQL Editor)
Usa esta query para ver si las tablas críticas tienen RLS activado:

```sql
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'products',
    'users',
    'roulette_config',
    'orders',
    'coupons',
    'coupon_redemptions',
    'mystery_boxes',
    'mystery_box_prizes',
    'mystery_tickets',
    'mystery_spins'
  )
order by c.relname;
```

Si `rls_enabled` sale `true` en todas, el aviso de 10 errores debería desaparecer en la siguiente revisión de Security Advisor.

---

## Sobre el popup "Potential issue detected with your query"
Ese popup aparece porque algunos scripts usan `drop policy` o cambios estructurales.

En este proyecto es esperado y normal para migraciones idempotentes.
No estás borrando tablas de negocio ni datos de pedidos por ejecutar los bloques indicados arriba.
