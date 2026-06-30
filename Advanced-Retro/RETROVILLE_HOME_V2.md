# RETROVILLE_HOME_V2

Fecha: 2026-06-30

## Estado de esta iteración

- La estructura del home se mantiene tal como quedó aprobada: visión, protagonistas, episodios, distritos, buyer brief, comunidad y redes.
- El email personal visible en frontend queda sustituido por `pitch@advancedretro.es`.
- La solicitud de biblia y de dossier privado abre el correo predeterminado del usuario mediante `mailto:` ya preparado, sin modal intermedio.
- La capa de comunidad se mantiene en la opción B: métricas reales de registro y perfiles declarados en formulario, sin testimonios inventados.

## Qué opción se eligió para comunidad

Se aplicó la **opción B**.

Motivo:

- ya existe captación real en `retroville_waitlist`
- ya existe tracking de intención en `analytics_events`
- todavía no hay una base visible de testimonios externos verificados para convertir esa franja en prueba social real sin forzarla

Resultado:

- el home enseña registros reales, registros al reveal y reparto por perfiles
- el archivo social y fandom extendido vive separado en `/retroville/comunidad`

## Fandom separado

- Home: selección corta y más ligera
- Archivo ampliado: `/retroville/comunidad`

## Correo y documentos privados

- Dirección pública usada en el frontend: `pitch@advancedretro.es`
- Botones privados revisados:
  - `Solicitar biblia`
  - `Solicitar dossier`
- El flujo actual abre la app o plataforma de correo predeterminada del usuario con asunto y cuerpo ya rellenos.
- Verificado sobre el build local de producción en `http://127.0.0.1:3900/retroville`:
  - no queda modal intermedio
  - no queda rastro visible de `flardop44@gmail.com`
  - los `mailto:` apuntan a `pitch@advancedretro.es`

## Registro, waitlist y analytics

Verificado en código:

- API unificada: `/app/api/retroville/waitlist/route.ts`
- Base de captación: `retroville_waitlist`
- Eventos:
  - `retroville_newsletter_signup`
  - `retroville_event_signup`

El formulario del reveal y el de newsletter usan el mismo sistema de captura.

## Admin existente

Ya existe un panel dedicado para lectura comercial y de audiencia:

- `/admin/retroville`

Incluye lectura de sesiones, países, ciudades, tiempo medio, conversión de newsletter, conversión de reveal, clicks buyer y accesos privados.

## Structured data

Estado actual:

- El home mantiene `CollectionPage`
- Incluye `TVSeries`
- Incluye `BreadcrumbList`
- Incluye `FAQPage`
- Lighthouse local en producción marca `Structured data is valid`

Pendiente ideal para cierre final:

- pasar Rich Results Test sobre la URL pública ya desplegada después de publicar esta iteración

## .ics

Estado actual:

- el bloque de reveal genera archivo `.ics`
- el archivo incluye `VCALENDAR`, `VEVENT`, `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION` y `URL`

Pendiente ideal para cierre final:

- validación manual final en Apple Calendar, Outlook y Google Calendar desde la versión pública

## Rendimiento

Mejoras aplicadas en esta pasada:

- retirada completa del cursor visual personalizado de la shell de Retroville
- limpieza del CSS residual del cursor
- simplificación del tratamiento del vídeo hero: menos filtros dinámicos y menos blur
- separación visual más clara en la portada de `Sketchbook`
- menos preloads innecesarios en renders e imágenes del home
- retirada de varios `will-change` y `backdrop-filter` no esenciales

Baseline previa disponible:

- Lighthouse desktop previo del home: Performance `57`, Accessibility `100`, Best Practices `92`, SEO `100`

Medición final repetida con build local de producción:

- Performance `98`
- Accessibility `100`
- Best Practices `96`
- SEO `100`
- FCP `0.4 s`
- LCP `1.2 s`
- Speed Index `0.4 s`
- TBT `0 ms`
- CLS `0`
- Server response `20 ms`

Lectura práctica:

- el home ya no tiene síntomas de página pesada en producción
- si todavía se nota algo “lento” al mover el cursor, lo más normal es que venga del navegador embebido o del modo `next dev`, no del build optimizado final

## Pendiente para la siguiente iteración

- pasar Rich Results Test sobre la URL pública ya actualizada
- validar `.ics` en clientes reales finales
- revisar la URL pública tras despliegue para confirmar que refleja exactamente este estado

## Estado de publicación

- Este documento refleja estado verificado en código y en build local de producción.
- Que aparezca igual en la web pública depende del despliegue final.
- Si no se ha lanzado deploy todavía, lo correcto es considerarlo **aplicado localmente pero no publicado aún**.
