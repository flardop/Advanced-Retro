# Retroville Admin

Panel privado del universo Retroville en `/retroville/admin`.

## Rutas protegidas

- `/retroville/admin`
- `/retroville/admin/usuarios`
- `/retroville/admin/analiticas`
- `/retroville/admin/tiempo-real`
- `/retroville/admin/seo`
- `/retroville/admin/errores`
- `/retroville/admin/contenido`
- `/retroville/admin/configuracion`

## Rutas públicas de acceso

- `/retroville/admin/login`

## Protección aplicada

- Middleware en `middleware.ts` para redirigir cualquier acceso sin cookie de sesión a `/retroville/admin/login`.
- Cookie privada `retroville_admin_session` con:
  - `httpOnly`
  - `sameSite=lax`
  - `secure` en producción
  - expiración de 24 horas
- Segunda comprobación server-side en `app/retroville/admin/(panel)/layout.tsx` mediante `requireRetrovilleAdminPageSession()`.
- Bloqueo tras 5 intentos fallidos durante 15 minutos por IP hash.

## Esquema de base de datos añadido

Migración principal:

- `supabase/migrations/20260703_retroville_admin_panel.sql`

Migración de actualización de contacto:

- `supabase/migrations/20260704_update_retroville_contact_email.sql`

### Tablas nuevas

- `retroville_admin_users`
- `retroville_admin_sessions`
- `retroville_admin_login_attempts`
- `retroville_admin_access_logs`
- `retroville_seo_audits`
- `retroville_crawler_logs`

### Tablas existentes ampliadas

- `retroville_waitlist`
  - `status`
  - `page_path`
  - `page_title`
  - `session_id`
  - `device_type`
  - `browser`
  - `os`
  - `referrer`
  - `country`
  - `city`
  - `last_seen_at`
  - `visits_count`
  - `unsubscribed_at`

- `error_logs`
  - `status`
  - `occurrence_key`
  - `browser`
  - `device_type`
  - `user_agent`

## Dependencias nuevas o usadas por esta iteración

- `bcryptjs`
- `date-fns`
- `recharts`

## Cómo cambiar el acceso del admin

El usuario inicial se inserta desde la migración SQL en `retroville_admin_users`.

Para cambiar contraseña:

1. Accede a `/retroville/admin/configuracion`
2. Usa el formulario de cambio de contraseña

Para cambiar el email/login inicial:

1. Edita el registro correspondiente en `retroville_admin_users`
2. Si quieres resembrarlo desde SQL, ajusta también la migración `20260703_retroville_admin_panel.sql`

## Ajustes públicos editables desde el panel

- `retroville_contact_email`
- `retroville_hero_tagline`
- `retroville_buyer_brief_copy`
- `retroville_event_description`
- `retroville_waitlist_open`
- `retroville_maintenance_mode`
- `retroville_launch_date`

## Pendiente para una segunda iteración

- Aplicar automáticamente migraciones de Supabase dentro del flujo de despliegue
- Conectar todos los bloques públicos de Retroville a los ajustes editables del panel sin excepciones
- Añadir noindex explícito a la pantalla de login del admin
- Añadir auditorías SEO persistentes automáticas
- Añadir mejor observabilidad de despliegue y estado del panel
