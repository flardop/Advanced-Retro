# SEO Playbook (Advanced Retro)

Guía rápida para mantener SEO sin tocar lógica compleja.

## 1) Dónde editar textos SEO

- Base y helpers:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/lib/seo.ts`
- Home:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/page.tsx`
- Tienda:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/tienda/page.tsx`
- Producto:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/producto/[id]/page.tsx`
- Comunidad:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/comunidad/page.tsx`

## 2) Reglas actuales de indexación

- Indexables: home, tienda, producto, comunidad, contacto, legales, ruleta, encargo.
- No indexables: admin, login, perfil, carrito, checkout, success.
- Configuración:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/robots.ts`

## 3) Sitemap

- Archivo:
  - `/Users/joelrivera/tienda-web/Advanced-Retro/app/sitemap.ts`
- Incluye:
  - rutas estáticas públicas,
  - productos,
  - anuncios de comunidad aprobados,
  - perfiles de vendedor con actividad.

## 4) Schema.org implementado

- WebSite + Organization en layout global.
- FAQ en home/tienda/servicio de encargo.
- Product + Breadcrumb en fichas de producto.
- Person en perfil público vendedor.
- Product en detalle de anuncio comunidad.

## 5) Checklist SEO operativo

1. Añadir `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` en Vercel.
2. Confirmar propiedad en Search Console.
3. Enviar sitemap: `https://advancedretro.es/sitemap.xml`.
4. Revisar cobertura e indexación cada semana.
5. Actualizar títulos/descripciones de páginas principales cuando cambie catálogo/servicios.

## 6) Recomendación de contenido (alto impacto)

- Publicar 1-2 guías semanales en formato post/landing:
  - “cómo identificar original vs repro”
  - “qué incluye un juego completo por consola”
  - “guía de conservación de cajas y manuales”
- Enlazar internamente esas guías desde `/tienda` y fichas de producto.
