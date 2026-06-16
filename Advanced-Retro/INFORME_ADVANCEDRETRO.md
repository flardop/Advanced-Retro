# Informe AdvancedRetro

Fecha: 16 de junio de 2026  
Entorno auditado: local (`http://127.0.0.1:3020`)  
Validación final: `npm run lint` OK, `npm run build` OK

## Resumen ejecutivo

He trabajado sobre la tienda principal de `advancedretro.es` para separar mejor su identidad frente a `Retroville`, reforzar la propuesta de valor comercial, ordenar la navegación con criterio de búsqueda, mejorar títulos SEO en home/categorías/productos y subir la confianza visible en fichas.

Además he hecho un rastreo local tipo Screaming Frog sobre las URLs públicas clave, he comprobado `robots.txt`, `sitemap.xml`, canonicals, H1 y he pasado Lighthouse local a la home y a una ficha real de producto.

## Qué he cambiado

### 1. Separación clara entre tienda y Retroville

He reforzado la distinción entre ambos proyectos desde la home:

- En la hero ahora se explica en los primeros segundos qué vende la tienda, para quién y por qué comprar aquí.
- He añadido una sección nueva que separa visualmente:
  - `AdvancedRetro.es` como tienda de compra
  - `Retroville` como universo creativo paralelo
- He mantenido el enlace a `Retroville`, pero ya no compite con la intención comercial principal.

Archivos principales:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/Hero.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/StoreIdentitySplit.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/page.tsx`

### 2. Propuesta de valor de la tienda por encima del fold

He reescrito el bloque principal de entrada para que quede claro:

- qué vende la tienda
- que opera desde España
- que trabaja con fotos reales y estado visible
- que el soporte es humano

También he dejado chips de confianza visibles antes de que el usuario llegue a productos.

### 3. Menú principal reorganizado

He simplificado la navegación pública y la he agrupado mejor:

- `Tienda`
- `Servicios`
- `Universo`
- enlaces directos a `Comunidad`, `Quiénes somos` y `Contacto`

Dentro de `Tienda` he priorizado las plataformas de más intención:

- Game Boy
- Game Boy Advance
- Super Nintendo
- GameCube

Archivos:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/Navbar.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/components/Footer.tsx`

### 4. Rutas de categoría más limpias y orientadas a SEO

He reemplazado varios enlaces internos que antes dependían de query params por landings limpias:

- `/tienda/game-boy`
- `/tienda/game-boy-color`
- `/tienda/game-boy-advance`
- `/tienda/super-nintendo`
- `/tienda/gamecube`

Esto mejora:

- rastreo
- comprensión semántica de categoría
- enlazado interno

Archivos:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/Hero.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/Collections.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/components/Footer.tsx`

### 5. SEO de producto mejorado

He mejorado la generación de títulos de producto para que usen un formato más cercano a intención real de búsqueda:

- nombre del producto
- sistema/plataforma
- edición o tipo
- estado legible

Ejemplo validado:

- `Protector consola Nintendo GameCube · Accesorios · Nuevo | AdvancedRetro.es`

También he limpiado la lógica de branding para evitar títulos duplicados o contaminados con el nombre del dominio dos veces.

Archivo principal:

- `/Users/joelrivera/tienda-web/Advanced-Retro/lib/seo.ts`
- `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/producto/[id]/page.tsx`

### 6. SEO de categoría corregido

He revisado las landings de plataforma para que tengan:

- `H1` claro
- descripción optimizada
- párrafos introductorios
- breadcrumbs visibles
- JSON-LD de breadcrumb, FAQ e item list

También corregí un caso de duplicación en los títulos SEO de categoría.

Archivo:

- `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/tienda/[platform]/page.tsx`

### 7. Fichas de producto con más confianza visible

He añadido junto a la zona de compra un bloque de confianza con:

- envío desde España
- política de devoluciones accesible
- ayuda sobre compatibilidad y estado

Esto responde directamente al problema de “política de envíos y devoluciones visible antes de comprar”.

Archivo:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ProductDetail.tsx`

### 8. Página real de “Quiénes somos”

He sustituido la versión genérica/redirigida de `About` por una página real que cuenta:

- qué es AdvancedRetro
- qué relación tiene con Retroville
- cómo trabaja la tienda
- qué tipo de confianza intenta generar

Incluye metadatos y JSON-LD de FAQ/breadcrumb.

Archivo:

- `/Users/joelrivera/tienda-web/Advanced-Retro/app/about/page.tsx`

### 9. Más contexto útil en catálogo y destacados

He mejorado el catálogo y los destacados para que el usuario entienda mejor:

- plataforma
- estado
- tipo de pieza

sin depender solo de nombres internos.

Archivos:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/FeaturedProducts.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/Catalog.tsx`

### 10. Corrección de jerarquía SEO en comunidad

La página `/comunidad` no tenía `H1` claro. La he corregido para que el rastreo y la jerarquía semántica sean más sólidos.

Archivo:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/CommunityFeed.tsx`

## Rastreo local tipo Screaming Frog

He comprobado manualmente las rutas públicas más importantes tras los cambios:

| URL | Estado | H1 | Canonical | Resultado |
| --- | --- | --- | --- | --- |
| `/` | 200 | 1 | self | OK |
| `/tienda` | 200 | 1 | self | OK |
| `/tienda/super-nintendo` | 200 | 1 | self | OK |
| `/producto/protector-consola-nintendo-gamecube-p-5f23ffe7` | 200 | 1 | self | OK |
| `/about` | 200 | 1 | self | OK |
| `/comunidad` | 200 | 1 | self | OK |

Observaciones:

- No he detectado 404 críticos en estas rutas clave.
- `robots.txt` permite correctamente el rastreo público y bloquea zonas sensibles (`admin`, `cart`, `checkout`, etc.).
- `sitemap.xml` responde correctamente e incluye las URLs públicas relevantes.
- Los headers de seguridad básicos ya estaban correctamente servidos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, etc.).

## Lighthouse local

### Home

URL: `http://127.0.0.1:3020/`

- Performance: 75
- Accessibility: 96
- Best Practices: 92
- SEO: 100

### Ficha de producto

URL auditada:  
`http://127.0.0.1:3020/producto/protector-consola-nintendo-gamecube-p-5f23ffe7`

- Performance: 98
- Accessibility: 91
- Best Practices: 92
- SEO: 100

Nota:

- La primera pasada contra la URL por `id` devolvió una redirección `308` a la URL bonita con slug. La auditoría válida es la hecha sobre la URL final canónica.

## Qué he encontrado pero no he cambiado

### 1. El sistema de reseñas ya existe

No he implementado un sistema de reseñas desde cero porque la tienda ya tiene:

- UI de reseñas en ficha
- valoración media
- contador de reseñas
- envío de reseña desde modal
- soporte de fotos
- schema de `AggregateRating` y `Review`

Lo que sí he hecho es verificar que existe y funciona como base de confianza.

Archivos donde ya estaba:

- `/Users/joelrivera/tienda-web/Advanced-Retro/components/sections/ProductDetail.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/app/(shop)/producto/[id]/page.tsx`
- `/Users/joelrivera/tienda-web/Advanced-Retro/app/api/products/[id]/social/route.ts`

### 2. El Product schema ya estaba bien planteado

La ficha ya incluía `Product` schema con:

- `name`
- `description`
- `image`
- `offers`
- `availability`
- `price`
- `condition`
- `shippingDetails`
- `returnPolicy`
- `aggregateRating`
- `review`

Por eso no lo he reescrito. He preferido mantenerlo y centrar el trabajo en títulos, navegación e identidad.

### 3. Hay 45 productos con menos de 3 imágenes

Métrica sobre catálogo público:

- Total productos auditados: 529
- Productos sin imagen: 0
- Productos con menos de 3 imágenes: 45

Esto no lo he corregido automáticamente porque requiere trabajo de contenido real, no solo de código.

### 4. No he cerrado un checkout real con pago

No he documentado una compra completa real con pasarela externa porque eso requiere:

- credenciales de prueba válidas
- flujo completo de pago
- confirmación operativa de éxito/fracaso real

Sí he dejado observada la parte estructural del funnel, pero no he hecho un pago final real en este sprint.

### 5. La URL por `id` redirige a la URL bonita

Las fichas crudas tipo:

- `/producto/<id>`

redirigen a:

- `/producto/<slug>`

No lo he cambiado porque no es necesariamente un error: puede ser una decisión válida para consolidar SEO. Lo importante es que la canónica final está bien.

## Tres problemas críticos que siguen pendientes

### 1. Falta reforzar contenido visual real en parte del catálogo

Impacto: muy alto en conversión y confianza.

Aunque no hay productos completamente sin imagen, todavía hay `45` productos públicos con menos de `3` imágenes. Para una tienda retro y de coleccionismo esto afecta directamente a:

- confianza
- percepción de estado
- claridad de compra
- SEO visual

### 2. La home sigue siendo mejorable en rendimiento móvil

Impacto: alto en captación y primeras visitas.

La home ha quedado fuerte en SEO y claridad, pero su Lighthouse local de performance está en `75`, por debajo del nivel que me gustaría dejar como estándar para captación fría desde Google móvil.

Las fichas van muy bien (`98`), así que el problema está más arriba en:

- peso visual inicial
- carga de JS compartido
- densidad de elementos above the fold

### 3. Falta un test real de compra extremo a extremo

Impacto: alto en conversión.

La tienda necesita una pasada operativa completa con:

- usuario nuevo
- login/checkout
- validaciones
- pago de prueba
- confirmación final

Mientras eso no se pruebe con credenciales reales de entorno de test, no se puede afirmar que el funnel completo esté libre de fricción crítica.

## Siguiente sprint recomendado

Orden de prioridad recomendado:

1. Completar las `45` fichas con menos de 3 fotos reales.
2. Hacer optimización específica de performance móvil en home.
3. Ejecutar compra end-to-end con pasarela de test y documentar fricciones reales.
4. Revisar si conviene ampliar contenido editorial transaccional en categorías principales.

