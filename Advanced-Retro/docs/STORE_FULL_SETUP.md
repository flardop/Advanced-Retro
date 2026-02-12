# Advanced Retro — Guía completa de configuración (OAuth, Stripe, imágenes y etiquetas de envío)

Este documento explica, paso a paso y con comandos, cómo dejar la tienda completamente funcional.

1) Variables de entorno recomendadas

- `NEXT_PUBLIC_SUPABASE_URL` = https://<tu-proyecto>.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = <tu-anon-key>
- `SUPABASE_SERVICE_ROLE_KEY` = <tu-service-role>
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`

2) OAuth (Google / Apple)
- Sigue `docs/GOOGLE_OAUTH_SETUP.md` para Google.
- Para Apple, crea la App en Apple Developer, configura Redirect URIs igual que Google y pega las credenciales en Supabase Providers.
- Añade las variables en `.env.local` (o en Vercel) y reinicia la app.

3) Imágenes: renombrado y conversión HEIC
- Ya hay scripts: `scripts/generate-rename-suggestions.js`, `scripts/apply-rename-suggestions.js`, `scripts/convert-heic-to-jpeg.js`.
- Convertir HEIC localmente (recomendado) con ImageMagick (tiene mejor compatibilidad). Ejemplo:

```powershell
cd "c:\ruta\a\repo\Advanced-Retro\Imagenes\Juegos\Consolas"
Get-ChildItem -Filter *.HEIC -Recurse | ForEach-Object {
  & "C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe" convert "$_" "${($_.DirectoryName) + '\\' + ($_.BaseName) + '.jpeg'}"
}
```

- Alternativa: usar `scripts/convert-heic-to-jpeg.js` (requiere `sharp` con soporte libheif, que puede fallar en algunos entornos).

4) Subir imágenes a Supabase
- Exporta variables y ejecuta (PowerShell):

```powershell
$env:SUPABASE_URL='https://<tu-proyecto>.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='<tu-service-role>'
node scripts/upload-images-to-supabase.js --bucket public --dir "Imagenes/Juegos/Consolas"
```

- Salida: `uploaded_urls.json` con mapeo local->URL.

5) Stripe y checkout
- Añade `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- Crea webhook en Stripe apuntando a `/api/stripe/webhook` y añade `checkout.session.completed` como evento.
- El proyecto ya tiene `app/api/stripe/webhook/route.ts` que marca la orden como `paid` y genera una etiqueta PDF y la sube a Supabase Storage (bucket `public` por defecto). Si no tienes la tabla `shipments`, crea esta tabla en tu base de datos:

```sql
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  label_url text,
  tracking_code text,
  created_at timestamptz default now()
);
```

- Después del webhook, un registro en `shipments` contendrá `label_url` (public URL).

6) Flujo admin para marcar como enviado
- Puedes añadir en el panel admin (no incluido aquí) una vista que liste `shipments` y permita añadir `tracking_code` o marcar `shipped=true`.
- El webhook sólo genera PDF y crea `shipments` con `tracking_code` null; el admin actualiza ese campo.

7) Seguridad y recomendaciones
- No publiques `SUPABASE_SERVICE_ROLE_KEY` en repositorios públicos. Manténlo en variables de entorno del servidor (Vercel Environment Variables).
- Rota las claves si las compartiste en chats públicos.

---

Si quieres, aplico las inserciones/ajustes finales (crear tabla `shipments` en Supabase via SQL Editor) y preparo el endpoint admin para marcar envíos y agregar tracking.
