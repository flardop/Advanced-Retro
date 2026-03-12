# CODEX Memory Log

Este archivo mantiene trazabilidad breve de trabajo para continuar sin perder contexto.

## 2026-03-12 23:xx (fix acceso ficha producto por prefijo ID)
- Objetivo:
  - Corregir casos en los que `/producto/[id]` devolvía “Producto no disponible” al abrir desde tienda.
  - Mantener el cambio de botón de estilo fuera del layout global (ya aplicado antes).
- Causa detectada:
  - Se usaba `ilike('id', '<prefijo>%')` para resolver URLs cortas `slug-p-xxxx`.
  - En esquemas donde `products.id` es UUID, ese `ilike` puede fallar/no devolver filas.
- Cambios aplicados:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/producto/[id]/page.tsx`
    - Nueva resolución robusta por prefijo:
      - intento rápido con `ilike`;
      - fallback de escaneo `select id` + match por `startsWith` en JS;
      - fetch final por `eq('id', resolvedId)`.
    - Fallback adicional por `name ilike` cuando no resuelve por `slug`.
    - Fallback final a `sampleProducts` para evitar hard fail si entorno/policies fallan.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ProductDetail.tsx`
    - Misma estrategia de fallback por prefijo en cliente para evitar pantalla vacía tras hidratar.
- Validación:
  - `npm run build` ejecutado en `/Users/joelrivera/tienda-web/Advanced-Retro`: OK.
- Deploy:
  - Intento `npx vercel --prod --yes` falló por token inválido.
  - Error: `The specified token is not valid. Use vercel login to generate a new token.`

## 2026-03-12 21:xx (turno actual)
- Objetivo: corregir fallo de build Vercel por `useSearchParams` sin `Suspense`.
- Cambios aplicados:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/Navbar.tsx`
    - Se separo en `NavbarContent` + `NavbarFallback`.
    - `export default Navbar` ahora envuelve contenido en `<Suspense>`.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/Catalog.tsx`
    - Se separo en `CatalogContent` + `CatalogFallback`.
    - `export default Catalog` ahora envuelve contenido en `<Suspense>`.
- Siguiente comprobacion:
  - Ejecutar `npm run build` para validar que desaparece el error de prerender.
  - Si hay mas rutas afectadas, aplicar el mismo patron.

### Validacion local
- `npm run build` ejecutado en `/Users/joelrivera/tienda-web/Advanced-Retro`.
- Resultado: OK, sin errores de prerender y sin error de `useSearchParams`.

## 2026-03-12 22:xx (fix producto no disponible + vídeo local sin YouTube)
- Objetivo:
  - Quitar botón flotante global de estilos.
  - Corregir fichas que acababan en “Producto no disponible”.
  - Eliminar dependencia de YouTube en sección multimedia.
  - Generar y subir vídeo local a Supabase Storage.
- Cambios aplicados:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/layout.tsx`
    - Eliminado `ThemeStyleMenu` global del layout.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ProductDetail.tsx`
    - Fix crítico: cuando no hay `supabaseClient` en cliente, ahora mantiene `initialProduct` en vez de poner `product=null`.
    - Eliminado fallback de búsqueda YouTube en ficha de producto.
    - Filtrado de embeds para no mostrar proveedor YouTube.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/producto/[id]/page.tsx`
    - Fallback server-side con cliente público (anon) cuando no hay `SUPABASE_SERVICE_ROLE_KEY`, evitando fichas vacías en producción.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/MediaShowcase.tsx`
    - Rediseñado a modo local-only (sin iframes YouTube).
    - Reproductor usando URLs públicas de Supabase Storage.
- Media generada y subida:
  - Script ejecutado: `bash scripts/generate-intro-media.sh`.
  - Subidas completadas a bucket `public`:
    - `https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/advanced-retro-intro.mp4`
    - `https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/advanced-retro-jingle.mp3`
    - `https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/intro-poster.jpg`
- Validación:
  - `npm run build` ejecutado: OK (sin errores de TypeScript ni prerender).

### Publicacion
- Commit: `b83f0fb`.
- Mensaje: `fix: wrap searchParams consumers in suspense for prerender`.
- Push: `main` -> `origin/main` (redeploy Vercel debe activarse automaticamente).

## 2026-03-12 16:xx (continuación: móvil + encargos comunidad)
- Objetivo: reforzar UX móvil y cerrar reglas del flujo de ayuda en encargos.
- Cambios aplicados:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/lib/supportTickets.ts`
    - `postTicketMessage` ahora valida estado del encargo cerrado/cancelado en backend.
    - Si escribe el ayudante asignado en ticket `claimed`, se renueva `helper_inactive_deadline` automáticamente.
    - `reopenInactiveConciergeTickets` ahora bloquea al ayudante inactivo en ese mismo ticket (`blocked_helper_ids`) al reabrir por timeout.
    - `completeConciergeTicket` exige datos mínimos en propuesta del ayudante: plataforma, precio final, originalidad y modo de entrega.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/Navbar.tsx`
    - Nuevo menú inferior fijo en móvil (Tienda, Comunidad, Encargos, Carrito, Perfil/Entrar).
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/layout.tsx`
    - `main` con padding inferior móvil para no tapar contenido por menú fijo.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ProfileView.tsx`
    - Nuevo modo móvil en tickets: selector `Lista/Chat` para no saturar pantalla.
    - Al abrir ticket desde lista en móvil, cambia automáticamente a vista chat.
    - Añadida etiqueta de tiempo restante para reasignación en tickets `claimed`.
    - Formulario de propuesta helper extendido con `store_review_required`.
    - Cabecera perfil ajustada para evitar solapes en anchos intermedios.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ConciergeOpenRequests.tsx`
    - Tarjetas con más contexto y regla visible de timeout/reapertura.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/servicio-compra/page.tsx`
    - Copy actualizado sobre bloqueo del helper por inactividad en mismo encargo.
  - `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/CommunityFeed.tsx`
    - Ajustes de layout móvil (búsqueda/filtros/acciones) y densidad de grid para mejor legibilidad.
- Validación:
  - `npm run build` ejecutado: OK.
