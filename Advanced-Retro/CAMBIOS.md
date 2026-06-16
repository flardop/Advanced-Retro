# CAMBIOS

Fecha: 2026-06-12

## Retroville SEO y rastreo

- Corregidos los metadatos específicos de Retroville para que `/retroville/personajes` y `/retroville/sketches` ya no hereden copy ni contexto de la tienda general.
- Revisado el `title` de `/retroville/personajes` para eliminar el problema de repetición y dejarlo como título único y específico.
- Cambiado `category` a `entertainment` en las páginas de Retroville y en su layout de sección.
- Añadidos datos estructurados `TVSeries` y `BreadcrumbList` en:
  - `/retroville`
  - `/retroville/presentaciones`
  - `/retroville/personajes`
  - `/retroville/sketches`
  - `/retroville/legal`
- Mantenidos canonical tags autorreferenciales usando el helper compartido de metadatos de la app.
- Actualizado `sitemap.xml` para incluir:
  - `/retroville`
  - `/retroville/legal`
  - `/retroville/personajes`
  - `/retroville/sketches`
  - `/retroville/presentaciones`
- La prioridad de las URLs de Retroville queda en `0.84` o superior y la landing principal en `0.92`.
- Revisado `robots.txt` para asegurar que Googlebot y el rastreo general no bloquean ninguna URL pública de Retroville.

## Presentaciones

- Se ha restaurado `/retroville/presentaciones` como ruta pública válida.
- Decisión tomada:
  - No se ha recuperado el antiguo laboratorio de cinco estilos porque ya se descartó por dirección creativa.
  - `/retroville/presentaciones` ahora funciona como alias de la presentación oficial actual de Retroville.
- Añadidos enlaces hacia `/retroville/presentaciones` desde `/retroville/personajes` y `/retroville/sketches`.
- Eliminadas las redirecciones de `next.config.js` que enviaban `/retroville/presentaciones` de vuelta a `/retroville`.

## Waitlist y countdown

- Ocultado el estado perjudicial `0 dentro`.
- Sustituido por el copy: `Sé de los primeros`.
- Añadida explicación bajo el contador para dejar claro qué sucede el 10 de noviembre de 2026:
  - llega la primera señal pública y el primer aviso prioritario a la waitlist.

## Open Graph y social sharing

- Ajustadas las imágenes sociales principales para evitar placeholders genéricos:
  - `/retroville` usa una imagen de universo
  - `/retroville/personajes` usa una imagen de reparto
  - `/retroville/sketches` usa un process board
  - `/retroville/presentaciones` usa una imagen del universo
- Las tarjetas de Twitter y Open Graph quedan alineadas con esas imágenes al generarse desde el helper común.

## Accesibilidad y headings

- Revisada la jerarquía de encabezados en las páginas públicas principales de Retroville.
- Verificación realizada:
  - un único `H1` claro por página pública
  - `H2` usados para secciones principales
  - `H3` usados para tarjetas, personajes y bloques internos
- Mejorados los textos `alt` en renders, avatars, previews y tableros de proceso para que sean descriptivos y útiles tanto para SEO como para accesibilidad.

## Rendimiento móvil

- Revisado el uso de `loading="lazy"` en las imágenes de Retroville fuera de los elementos realmente prioritarios.
- Reducido el número de imágenes marcadas como críticas en la landing y en los bloques de reparto para evitar sobrecarga inicial.
- Convertidas varias imágenes pesadas a `WebP` y actualizadas sus referencias:
  - `retroville-logo.webp`
  - `nox-push.webp`
  - `button-crew-push.webp`
  - `retroville-central-plaza-concept.webp`
  - `retroville-metro-pod-concept.webp`
  - `retroville-urban-props-concept.webp`
  - `retroville-hero-portal-bg.webp`
  - `retroville-cast-presentation.webp`
  - `process/hotel-translation-board.webp`
- Ampliada la optimización a contenido público de `personajes` y `sketches`:
  - renders principales del reparto
  - figurantes y piezas de ensemble
  - hojas de diseño de personajes
  - boards de traducción visual y mapas de distrito
- Ejemplos de reducción real de peso:
  - `bit-grave-district-board.png` de `3.22 MB` a `0.40 MB`
  - `school-translation-board.png` de `3.00 MB` a `0.33 MB`
  - `jow-andrew.png` de `1.73 MB` a `0.15 MB`
  - `retroville-mafia.png` de `1.51 MB` a `0.16 MB`
- Objetivo de esta decisión:
  - bajar peso inicial en móvil sin tocar diseño ni estructura visual.

## 404 de Retroville

- Añadida una 404 propia para Retroville con identidad de sección.
- Añadido un catch-all en `/retroville/[...missing]` para que cualquier URL rota dentro de Retroville aterrice en esa pantalla y no en la 404 genérica del dominio.

## Redes y enlaces

- Revisado el enlace de Reddit.
- Decisión tomada:
  - no se mantiene ningún enlace al perfil personal de Reddit dentro de las redes públicas de Retroville.
  - si en el futuro existe una comunidad oficial de Retroville, conviene reintroducirla con una URL propia del proyecto.

## Limpieza técnica adicional

- Revisado el frontend de Retroville en busca de `console.log`.
- Resultado:
  - no se ha dejado `console.log` en los componentes o páginas públicas de Retroville.
  - sí existen `console.log` en scripts internos y utilidades de mantenimiento del proyecto general, y no se han tocado porque no afectan a la experiencia pública ni a SEO.

## Nota final

- Se ha priorizado claridad técnica, rastreo, accesibilidad y rendimiento sin rediseñar la experiencia visual.
- Cuando una decisión no estaba cerrada por contexto, se ha escogido la opción menos invasiva y más coherente con el estado actual del proyecto.

---

Fecha: 2026-06-15

## Retroville analytics, newsletter y conversion

- La antigua waitlist pública de Retroville se ha reencuadrado como newsletter con identidad propia:
  - nombre visible: `La Señal de Retroville`
  - propuesta de valor más concreta
  - CTA y mensajes de apoyo revisados en desktop y móvil
- Cuando un usuario se apunta, ahora se dispara un evento de conversión en frontend y backend:
  - `gtag('event', 'retroville_newsletter_signup', ...)`
  - `plausible('Retroville newsletter signup', ...)`
  - persistencia adicional en `analytics_events` para análisis interno
- El alta guarda más contexto para que luego puedas leer conversiones por:
  - página de origen
  - dispositivo
  - navegador
  - sistema operativo
  - referrer
  - sesión de tracking
- También se añadió tracking de navegación de sección para Retroville:
  - pageview por cambio de ruta
  - agrupación por zona `retroville`

## Search Console y metadatos de verificación

- Añadido el meta tag de verificación de Google Search Console en el layout de Retroville.
- La verificación toma como fuente:
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` si existe
  - o el token ya presente en el proyecto: `googlebffb5f7b5e8a2336`
- Además del meta tag, el proyecto ya expone el archivo público de verificación:
  - `/googlebffb5f7b5e8a2336.html`
- Resultado:
  - la parte técnica para verificar Retroville queda preparada
  - si quieres cambiar el token en el futuro, basta con actualizar la variable o el archivo público

## Shell de experiencia y coherencia de universo

- Añadido un shell cliente específico de Retroville con:
  - barra fina de progreso de scroll
  - transición sutil entre rutas
  - cursor custom con identidad Retroville
  - easter egg de señal oculta activable con el código Konami o `window.retrovilleSignal()`
- Se ha mantenido el diseño principal, pero se ha reforzado la sensación de ecosistema unificado entre `/retroville`, `/personajes`, `/sketches`, `/press` y `/faq`.

## Press kit y FAQ

- Añadida la subpágina `/retroville/press` con:
  - logotipo descargable en `SVG`
  - activos descargables en `PNG`
  - biblia PDF enlazada
  - descripción oficial corta, media y larga
  - datos básicos del proyecto para medios
- Añadida la subpágina `/retroville/faq` con preguntas base de proyecto, lanzamiento, seguimiento y estado actual.
- Ambas páginas incluyen datos estructurados y enlaces internos coherentes con el ecosistema Retroville.

## Admin de Retroville

- El panel específico de admin de Retroville ahora muestra la parte de newsletter con más claridad:
  - `Newsletter total`
  - `Altas en rango`
  - `Conversion newsletter`
- Añadidos bloques visuales para revisar:
  - páginas que más convierten
  - dispositivos que más convierten
- También se ampliaron los quick links del admin hacia:
  - `/retroville/presentaciones`
  - `/retroville/press`
  - `/retroville/faq`

## Rendimiento, cache y shell técnico

- Añadidas cabeceras de cache para recursos estáticos de Retroville y descargas.
- En desarrollo, `/_next/static/*` queda forzado sin cache para evitar falsos positivos con chunks viejos.
- En producción, los recursos estáticos quedan con cache larga e inmutable donde corresponde.
- Añadido `manifest.webmanifest` de Retroville.
- Añadidos iconos específicos de sección:
  - favicon 16x16
  - favicon 32x32
  - apple touch icon 180x180

## Fuentes y render inicial

- Centralizadas las fuentes de Retroville en un helper compartido para reutilizarlas sin duplicar configuración.
- Añadido `head.tsx` específico de Retroville con CSS crítico inline para el primer render visible.
- Esto no sustituye una estrategia avanzada de extracción de critical CSS de build, pero sí mejora el arranque sin tocar la estructura visual.

## Revisión móvil y accesibilidad

- Se revisaron las páginas principales de Retroville en viewport tipo iPhone SE (`320x568`):
  - `/retroville`
  - `/retroville/personajes`
  - `/retroville/sketches`
  - `/retroville/press`
  - `/retroville/faq`
  - `/retroville/no-existe`
- Resultado de revisión:
  - sin scroll horizontal visible
  - un único `H1` claro por página
  - sin errores de consola en la landing durante la revisión
- También se revisó la accesibilidad básica de imágenes y no quedan `alt=""` vacíos en el contenido público principal de Retroville.

## Lighthouse

- Se ejecutó auditoría Lighthouse en entorno local de desarrollo para:
  - `/retroville`
  - `/retroville/personajes`
  - `/retroville/sketches`
  - `/retroville/press`
  - `/retroville/faq`
- Scores obtenidos en desarrollo:
  - `/retroville`: Performance `57`, Accessibility `96`, Best Practices `92`, SEO `100`
  - `/retroville/personajes`: Performance `50`, Accessibility `100`, Best Practices `92`, SEO `100`
  - `/retroville/sketches`: Performance `55`, Accessibility `100`, Best Practices `92`, SEO `100`
  - `/retroville/press`: Performance `56`, Accessibility `100`, Best Practices `92`, SEO `100`
  - `/retroville/faq`: Performance `60`, Accessibility `100`, Best Practices `92`, SEO `100`
- Interpretación:
  - SEO y accesibilidad quedan fuertes
  - el cuello de botella principal sigue siendo el peso visual y la naturaleza rica en renders del proyecto
- Limitación encontrada:
  - el intento de Lighthouse en servidor local de producción quedó bloqueado por un error de runtime del middleware Edge (`Code generation from strings disallowed for this context`)
  - eso impide usar ese entorno local como referencia final de producción hasta corregir ese problema general del middleware

## Estado de calidad adicional

- `npm run lint` pasa
- `npm run build` pasa
- no se detectaron errores de consola en la landing de Retroville durante la revisión final
- no hay enlace público al perfil personal de Reddit en la superficie pública de Retroville
- se limpiaron los textos visibles que todavía hablaban de "lista de espera vacía" para mantener la nueva identidad de newsletter
- el monitoring de errores de cliente queda conectado al endpoint interno `/api/admin/log-error` mediante listeners de `window.error` y `unhandledrejection`
- esto no es Sentry, pero sí deja una base operativa para detectar fallos de Retroville dentro del panel de admin sin tocar el diseño público
