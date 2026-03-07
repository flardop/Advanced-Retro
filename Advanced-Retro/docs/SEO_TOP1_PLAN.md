# SEO TOP 1 - Plan Operativo AdvancedRetro.es

Estado: marzo 2026

## 1) Cambios aplicados en código (ya implementados)

- Metadata global reforzada con:
  - canonical + hreflang (`es-ES`, `x-default`)
  - `creator` y `publisher`
- Schema global ampliado:
  - `Organization`
  - `WebSite` (con `SearchAction`)
  - `OnlineStore`
  - `Store` (local business base España)
- Página de tienda:
  - `BreadcrumbList` JSON-LD
  - `FAQPage` JSON-LD
  - `ItemList` JSON-LD
  - Bloque de contenido SEO largo (estructura H2/H3 + enlaces internos)
- Ficha de producto:
  - `Product` JSON-LD mejorado
  - `AggregateRating` (si hay datos)
  - `Review` (hasta 3 reseñas)
  - `OfferShippingDetails` y `MerchantReturnPolicy`
- UX SEO:
  - migas de pan visibles en `/tienda` y `/producto/[id]`
- Rendimiento:
  - `SafeImage` ahora define `sizes` por defecto en imágenes `fill` para reducir bytes y mejorar LCP.

## 2) Configuración externa obligatoria (manual)

Estos puntos no se pueden completar solo con código:

1. Google Search Console
   - Verificar dominio `advancedretro.es`
   - Enviar sitemap: `https://advancedretro.es/sitemap.xml`
   - Revisar informe de cobertura e indexación semanalmente

2. Google Analytics / Consent Mode
   - Validar que GA4 recoge eventos con consentimiento
   - Verificar que sin consentimiento no se dispara tracking analítico

3. Google Business Profile (SEO local España)
   - Ficha con NAP consistente (nombre, dirección, teléfono)
   - Categoría correcta y fotos reales
   - Responder reseñas y publicar actualizaciones periódicas

4. Backlinks de calidad (off-page)
   - Conseguir menciones en medios/foros/blogs retro
   - Evitar compra de enlaces spam o PBN
   - Objetivo: crecimiento natural de dominios de referencia

5. EEAT comercial
   - Completar páginas legales con datos empresariales reales
   - Mostrar contacto/soporte y política de devoluciones clara
   - Publicar contenido experto recurrente (guías retro)

## 3) KPIs SEO semanales

- Impresiones orgánicas (Search Console)
- CTR medio por consulta
- Posición media por URL objetivo
- Core Web Vitals:
  - LCP <= 2.5 s
  - CLS <= 0.1
  - INP <= 200 ms
- URLs válidas indexadas
- Errores 404 y redirecciones

## 4) Prioridad siguiente sprint

1. Crear landing SEO por plataforma (`/tienda/game-boy`, `/tienda/gamecube`, etc.).
2. Añadir bloque de “productos relacionados” en ficha para enlazado interno profundo.
3. Implementar sistema de artículos/guías retro con schema `Article`.
4. Auditar Lighthouse móvil en producción y corregir top 3 cuellos de botella.

