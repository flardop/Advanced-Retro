# SEO 1000 (Framework Operativo)

Documento práctico para escalar posicionamiento de `advancedretro.es` sin improvisar.

## Enfoque realista

No se ejecutan "1000 cambios únicos" manuales en una sola pasada.  
Se aplica un framework repetible: **100 prácticas x 10 bloques del sitio = 1000 ejecuciones SEO**.

Bloques:
- Home
- Tienda
- Producto
- Comunidad
- Vendedor público
- Mystery/Ruleta
- Servicio de compra
- Blog/Contenido futuro
- Legal
- Internacionalización

## Lo que ya quedó aplicado en código

- Metadatos normalizados con límites SEO de título y descripción.
- Open Graph/Twitter con `image` estructurada.
- JSON-LD de `ItemList` en `/tienda`.
- JSON-LD de `Product` mejorado con `aggregateRating` cuando existe.
- `noIndex` en `/comunidad/publicar`.
- Sitemap depurado (sin páginas no indexables por defecto).
- `manifest.webmanifest`.
- Caching y headers técnicos para estabilidad de rastreo y rendimiento.

## Checklist SEO técnico (100 prácticas base)

### 1) Indexación y rastreo
- [ ] Una única URL canónica por página.
- [ ] Redirección 308 a host canónico.
- [ ] HTTPS forzado.
- [ ] `robots.txt` sin bloquear contenido indexable.
- [ ] Bloqueo de áreas privadas (`/admin`, `/checkout`, `/perfil`).
- [ ] `noindex` en páginas transaccionales.
- [ ] Sitemap actualizado diario/semanal.
- [ ] URL limpias con slug.
- [ ] Sin cadenas de redirección múltiples.
- [ ] Sin enlaces rotos internos.

### 2) Metadatos on-page
- [ ] `<title>` único por página.
- [ ] Descripción única por página.
- [ ] Título con intención comercial en fichas.
- [ ] Descripción con precio/stock/valor.
- [ ] Keywords semánticas (sin stuffing).
- [ ] OG title/description coherentes.
- [ ] Twitter card completa.
- [ ] Imagen social de calidad.
- [ ] Metadatos `robots` correctos por contexto.
- [ ] Sin títulos truncados graves.

### 3) Estructura semántica
- [ ] Un `h1` principal por URL.
- [ ] Jerarquía `h2/h3` ordenada.
- [ ] Texto descriptivo indexable por sección.
- [ ] Secciones de FAQs con contenido real.
- [ ] Evitar bloques vacíos.
- [ ] Evitar textos duplicados entre URLs.
- [ ] Botones con texto descriptivo.
- [ ] Anchors internos de navegación útil.
- [ ] CTA con intención explícita.
- [ ] Información de confianza visible (envío/soporte/garantías).

### 4) Datos estructurados
- [ ] `Organization` global.
- [ ] `WebSite` + `SearchAction`.
- [ ] `BreadcrumbList` en páginas profundas.
- [ ] `Product` schema en ficha.
- [ ] `Offer` con precio/moneda/disponibilidad.
- [ ] `AggregateRating` cuando exista.
- [ ] `FAQPage` donde haya preguntas reales.
- [ ] `ItemList` en listados.
- [ ] Datos sin contradicción con la UI.
- [ ] JSON-LD válido en Rich Results Test.

### 5) Imágenes SEO
- [ ] Imagen principal real por producto.
- [ ] Galería de 2-6 imágenes cuando aplique.
- [ ] `alt` descriptivo y útil.
- [ ] Formatos modernos (`avif/webp`).
- [ ] Compresión sin pérdida visual.
- [ ] No usar placeholders en productos activos.
- [ ] Proporciones consistentes por tarjeta.
- [ ] `loading=lazy` en imágenes no críticas.
- [ ] Prioridad en LCP de portada.
- [ ] Cache estable de imágenes.

### 6) Rendimiento
- [ ] LCP <= 2.5s.
- [ ] INP <= 200ms.
- [ ] CLS <= 0.1.
- [ ] JS inicial controlado.
- [ ] Evitar iframes pesados de arranque.
- [ ] Carga diferida de widgets secundarios.
- [ ] API sin caché accidental en datos sensibles.
- [ ] Assets estáticos con cache larga.
- [ ] Sin renders duplicados innecesarios.
- [ ] Revisiones periódicas en producción.

### 7) Contenido comercial
- [ ] Descripción corta orientada a búsqueda.
- [ ] Descripción larga orientada a decisión.
- [ ] Tips de coleccionista por producto.
- [ ] Curiosidades no vacías.
- [ ] Diferenciar original/repro claramente.
- [ ] Estado del producto claro.
- [ ] Política de envío visible.
- [ ] Política de devoluciones visible.
- [ ] FAQ de compra en páginas clave.
- [ ] Texto de confianza en checkout.

### 8) Enlazado interno
- [ ] Enlaces de navegación principal claros.
- [ ] Relacionados por consola/plataforma.
- [ ] Relacionados por vendedor/comunidad.
- [ ] Breadcrumb navegable.
- [ ] Enlaces a categorías principales.
- [ ] Enlaces desde home a landing comercial.
- [ ] Profundidad de clic razonable.
- [ ] Evitar páginas huérfanas.
- [ ] Interlinking entre tienda y comunidad.
- [ ] Interlinking entre tienda y servicio de encargo.

### 9) Autoridad y confianza
- [ ] Datos de contacto visibles.
- [ ] Legal completo y enlazado.
- [ ] Política cookies/privacidad indexable.
- [ ] Señales de negocio real (España, soporte, envíos).
- [ ] Reseñas reales visibles.
- [ ] Perfil público de vendedor con historial.
- [ ] Transparencia de comisiones.
- [ ] Identidad de marca consistente.
- [ ] Correo de soporte operativo.
- [ ] Perfil de empresa en Google activo.

### 10) Medición y mejora
- [ ] Search Console verificado.
- [ ] Sitemap enviado y monitorizado.
- [ ] Cobertura de indexación revisada semanalmente.
- [ ] Queries y CTR por página revisados.
- [ ] Páginas con impresiones sin clics optimizadas.
- [ ] Top páginas con rebote alto revisadas.
- [ ] Top términos transaccionales reforzados.
- [ ] Informe mensual de rendimiento.
- [ ] Backlog SEO priorizado por impacto.
- [ ] Iteración continua.

## Automatización incluida en proyecto

- Auditoría automática de catálogo:
  - `npm run seo:audit`
  - Genera:
    - `docs/reports/seo-audit-products.md`
    - `docs/reports/seo-audit-products.csv`

- Enriquecimiento de copy para productos:
  - `npm run catalog:enrich-copy`

- Pipeline de imágenes:
  - `npm run images:fill:fallbacks`
  - `npm run images:upload`

## Secuencia recomendada semanal

1. `npm run seo:audit`  
2. Corregir hallazgos `high` del CSV.  
3. Ejecutar `npm run catalog:enrich-copy` para textos faltantes.  
4. Revisar Search Console (indexación + CTR).  
5. Repetir.

