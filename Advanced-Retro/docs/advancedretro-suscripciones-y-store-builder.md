# AdvancedRetro: Suscripciones + Store Builder

## Objetivo
Crear una capa de suscripción que:

1. premie a quien más compra o más se implica dentro de AdvancedRetro
2. aumente el valor percibido del ecosistema
3. abra una nueva línea de ingresos recurrentes
4. convierta AdvancedRetro en plataforma, no solo en tienda

## Idea central
El usuario no solo compra productos retro. También puede:

- vender dentro de la comunidad
- construir reputación
- desbloquear ventajas
- y, en el tier alto, lanzar su propia tienda independiente bajo la infraestructura de AdvancedRetro

## Producto propuesto
### 1. Suscripción `Collector`
Pensada para compradores frecuentes y coleccionistas.

Beneficios:

- acceso prioritario a drops seleccionados
- descuentos pequeños pero constantes
- alertas tempranas de restock
- tickets mensuales para mystery/ruleta
- acceso a listas privadas o preventas
- badge de miembro en perfil y comunidad

Precio sugerido:

- `9,90 €/mes`

### 2. Suscripción `Seller Pro`
Pensada para usuarios que compran, venden y quieren mover más inventario dentro del ecosistema.

Beneficios:

- todo lo de `Collector`
- comisiones reducidas en comunidad
- más visibilidad para listings
- panel mejorado de ventas
- analytics básicos
- soporte prioritario
- herramientas para loteado, duplicado y gestión de catálogo

Precio sugerido:

- `24,90 €/mes`

### 3. Suscripción `Store Builder`
Pensada para usuarios que quieren su propia tienda completa.

Beneficios:

- todo lo de `Seller Pro`
- creación de tienda propia con subdominio
  - `mitienda.advancedretro.es`
- panel administrativo independiente
- branding personalizable
- catálogo propio
- pedidos propios
- landing propia
- analytics de tienda
- onboarding guiado por IA

Variantes de marca:

- `Store Builder Core`
  - aparece `Made by AdvancedRetro`
- `Store Builder White Label`
  - sin branding visible de AdvancedRetro

Precio sugerido:

- `49,90 €/mes` para `Core`
- `89,90 €/mes` para `White Label`

## Enfoque correcto de producto
No lo vendería como “crea una tienda genérica”.

Lo vendería como:

`Lanza tu propia tienda retro sin tocar código, con infraestructura, pagos, catálogo y panel ya resueltos.`

Eso encaja mucho más con tu marca actual.

## Cómo encaja con AdvancedRetro
El ecosistema quedaría así:

- `AdvancedRetro` = marca principal y tienda editorial
- `Comunidad` = marketplace social
- `Suscripciones` = capa de fidelización y monetización recurrente
- `Store Builder` = expansión tipo plataforma

Así cada usuario puede evolucionar por niveles:

1. visitante
2. comprador
3. coleccionista suscrito
4. vendedor recurrente
5. dueño de tienda dentro del ecosistema

## Valor para el usuario
### Comprador fuerte

- siente que comprar más dentro de AdvancedRetro le desbloquea ventajas reales
- entra en una capa más premium del ecosistema

### Vendedor

- no depende solo de listings sueltos
- puede construir una “identidad comercial”

### Creador / coleccionista serio

- puede tener una tienda con su selección, tono y estilo
- pero sin montar una Shopify desde cero

## Store Builder: experiencia ideal
### Onboarding por IA
Este punto sí tiene muchísimo valor.

En vez de mostrar un formulario largo y frío, usaría un asistente guiado.

### Flujo recomendado
La IA hace preguntas por bloques:

#### Bloque 1: identidad

- nombre de la tienda
- estilo de marca
- tono
- público objetivo
- qué vende

#### Bloque 2: visual

- colores preferidos
- referencias visuales
- si quiere estilo limpio, premium, retro arcade, coleccionista, editorial, etc.

#### Bloque 3: catálogo

- qué tipos de productos venderá
- si quiere categorías automáticas
- si necesita variantes
- si quiere precios fijos o más flexibles

#### Bloque 4: funciones

- blog sí/no
- cupones sí/no
- wishlist sí/no
- newsletter sí/no
- comunidad sí/no
- subastas sí/no

#### Bloque 5: marca y dominio

- subdominio
- footer
- mostrar o no “Made by AdvancedRetro”

### Resultado
La plataforma genera automáticamente:

- homepage
- esquema visual
- categorías
- bloques de contenido
- navegación
- panel base

Y luego el usuario personaliza.

## Qué debería poder personalizar la tienda
- logo
- portada / hero
- colores
- tipografía
- categorías
- orden de secciones
- banners
- productos destacados
- textos legales y contacto
- SEO básico

## Qué no intentaría hacer en la V1
No haría desde el día uno:

- constructor visual totalmente libre tipo Webflow
- themes infinitos
- dominio externo completo
- multilenguaje complejo por tienda
- automatizaciones avanzadas de email

Eso te explota complejidad demasiado pronto.

## MVP recomendado
### Fase 1

- sistema de suscripciones
- perks para compradores
- perks para vendedores
- panel de suscripción dentro del perfil

### Fase 2

- `Store Builder Core`
- subdominios
- onboarding IA
- tienda generada con plantillas
- panel admin independiente

### Fase 3

- white label
- comisiones configurables
- analytics avanzados
- plantillas extra
- integraciones de marketing

## Arquitectura recomendada
### Modelo multi-tenant
Necesitas pensar esto como `multi-tenant`.

Cada tienda sería un `tenant`.

### Tablas nuevas clave

- `subscriptions`
- `subscription_plans`
- `storefronts`
- `storefront_domains`
- `storefront_themes`
- `storefront_pages`
- `storefront_products`
- `storefront_orders`
- `storefront_settings`
- `storefront_ai_generations`

### Relación principal

- un usuario puede tener cero o una tienda en V1
- cada tienda pertenece a un owner
- cada tienda tiene branding, settings y catálogo propio

## Monetización recomendada
Tendrías 3 capas de ingresos:

1. venta directa de tu tienda principal
2. suscripción mensual
3. potencial comisión o fee de infraestructura en tiendas creadas

## Riesgos
### Riesgo 1: demasiado ambicioso
Si intentas construir “Shopify retro con IA” en una sola fase, se va a volver inmanejable.

### Riesgo 2: complejidad legal y operativa
Si los ingresos son “para el dueño de la tienda”, hay que definir:

- quién cobra al cliente final
- quién factura
- quién responde ante devoluciones
- quién asume fraude

Eso no es solo producto. También es operación y legal.

### Riesgo 3: canibalización de la comunidad
Hay que diseñar bien la frontera entre:

- listing comunitario
- tienda profesional

## Recomendación honesta
La idea es muy buena.

No la trataría como “feature más”.
La trataría como una nueva línea de negocio:

`AdvancedRetro Platform`

## Lo que yo haría ya
### Sprint 1

- diseñar planes y perks
- añadir página de suscripciones
- definir reglas de acceso y badges

### Sprint 2

- diseñar arquitectura multi-tenant
- crear tablas base
- modelar subdominios

### Sprint 3

- construir onboarding IA
- generar primera tienda basada en plantilla

## Resumen ejecutivo
Sí, la idea tiene sentido.

Pero tiene sentido si se enfoca así:

- primero fidelización con suscripciones
- después herramientas pro
- después tienda propia bajo AdvancedRetro
- y solo en el tier alto, modo white label

No lo vendería como “suscripción para pagar más”.
Lo vendería como:

`Tu progresión dentro del ecosistema retro de AdvancedRetro.`
