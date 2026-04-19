# Retro Storage Auctions

## Resumen
`Retro Storage Auctions` convierte la ruta `/subastas` en un modulo de lotes verificados con:

- listado de almacenes digitales
- pagina de lote
- pujas con extension final
- chat del evento
- recordatorios
- solicitud de compra directa o alquiler
- apertura publica del almacen
- puente hacia el marketplace de Advanced Retro

La implementacion actual del repositorio usa estado persistido en `Supabase Storage` para poder funcionar ya sin una migracion obligatoria. El archivo SQL de este modulo deja la base preparada para moverlo a tablas PostgreSQL y realtime dedicado.

## UX/UI
### 1. Hub de subastas
Ruta: `/subastas`

Bloques:
- hero con explicacion del sistema
- resumen de actividad en vivo
- grid de almacenes
- ranking de pujadores
- panel rapido de funcionamiento

Cada tarjeta de almacen muestra:
- preview parcial o difuminada
- estado `Proximamente / En subasta / Finalizado`
- puja actual
- siguiente puja minima
- tiempo restante
- minimo garantizado
- recordatorios
- interes de compra/alquiler

### 2. Pagina de lote
Ruta: `/subastas/[slug]`

Bloques:
- visual principal del almacen
- panel de puja
- recordatorio y calendario
- verificacion y custodia
- pistas del contenido
- historial de pujas
- chat en directo
- apertura del almacen
- texto de transparencia y legal

### 3. Apertura
La apertura solo se permite cuando la subasta ya ha cerrado. Al abrir:
- se registra `revealed_at`
- se muestra inventario final
- si el usuario actual es el ganador, se le enseña CTA hacia el marketplace

## Arquitectura tecnica
### Runtime actual en repo
- Frontend: Next.js App Router
- API: Route Handlers (`/app/api/auctions/...`)
- Persistencia: `Supabase Storage` en `product-social/auctions/retro-storage/*.json`
- Auth: Supabase Auth
- Actualizacion: polling de cliente cada pocos segundos
- Moderacion: reportes ligeros por mensaje

### Runtime recomendado para produccion
- Frontend: Next.js + componentes cliente para puja/chat
- API: Route Handlers o servicio Node separado
- Base de datos: PostgreSQL / Supabase
- Tiempo real: Supabase Realtime o WebSockets dedicados
- Jobs:
  - cierre de subastas
  - notificaciones de inicio / ultima llamada
  - adjudicacion de ganador
  - activacion de almacenamientos vencidos
- Cola:
  - email
  - push
  - webhooks internos

## Tablas recomendadas
Archivo base: [database/retro_storage_auctions.sql](/Users/joelrivera/tienda-web/Advanced-Retro/database/retro_storage_auctions.sql)

Tablas incluidas:
- `retro_storage_auctions`
- `retro_storage_auction_hints`
- `retro_storage_auction_contents`
- `retro_storage_auction_bids`
- `retro_storage_auction_chat_messages`
- `retro_storage_auction_reminders`
- `retro_storage_auction_interest`
- `retro_storage_auction_reports`
- `retro_storage_storage_contracts`
- `retro_storage_awards`

## Endpoints
### Implementados en esta version
- `GET /api/auctions`
- `GET /api/auctions/[slug]`
- `POST /api/auctions/[slug]/bid`
- `GET /api/auctions/[slug]/chat`
- `POST /api/auctions/[slug]/chat`
- `POST /api/auctions/[slug]/reminder`
- `POST /api/auctions/[slug]/interest`
- `POST /api/auctions/[slug]/reveal`
- `POST /api/auctions/[slug]/reports`
- `GET /api/auctions/[slug]/calendar`

### Recomendados para fase 2
- `POST /api/auctions/[slug]/settle`
- `POST /api/auctions/[slug]/assign-award`
- `POST /api/auctions/[slug]/convert-to-marketplace-listings`
- `POST /api/auctions/[slug]/storage-contracts`
- `POST /api/auctions/[slug]/notifications/test`

## Logica de negocio
### Pujas
- cada lote tiene `starting_bid_cents`
- cada lote define `min_increment_cents`
- la puja nueva debe ser `>= nextBid`
- si entra una puja dentro de la ventana final:
  - se extiende el cierre
  - la extension se acumula sobre el final efectivo actual

### Transparencia
- no se presenta como apuesta
- siempre existe inventario fisico documentado
- se muestra un contenido minimo garantizado
- el contenido completo solo se revela despues del cierre

### Compra directa y alquiler
- `interest=buy`: el usuario deja una intencion formal de compra si el lote admite compra directa
- `interest=rent`: el usuario solicita almacenaje de ese lote o de piezas derivadas
- fase siguiente:
  - convertir esta interes en checkout real
  - emitir contrato de almacenamiento
  - definir impago y transferencia a Advanced Retro

### Marketplace
- el ganador del lote puede mover piezas al marketplace
- en MVP actual se muestra CTA hacia `/comunidad`
- en fase 2:
  - crear borradores de listings
  - rellenar fotos, valor estimado y ficha de verificacion

## Seguridad y anti-fraude
- auth obligatoria para pujar, chatear, revelar y reportar
- rate limit por usuario/IP en pujas, chat, intereses y reportes
- historial de pujas separado del chat
- moderacion ligera via reportes

### Recomendado para produccion
- KYC o verificacion reforzada para pujas altas
- depositos o autorizacion de pago para entrar en subastas premium
- limites por usuario
- deteccion de pujas coordinadas
- fingerprint de sesion y scoring antifraude

## Legal resumido
- evitar lenguaje de azar o apuestas
- explicar siempre:
  - que se compra
  - que parte esta oculta
  - que minimo esta garantizado
  - cuando se revela el contenido
- para almacenamiento:
  - precio por mes
  - dias de gracia
  - destino del inventario en caso de impago
- GDPR:
  - base legal de notificaciones
  - derecho de acceso y borrado
  - logs de moderacion y pujas con retencion definida

## Modelo de negocio
- comision por lote adjudicado
- tarifa de almacenamiento mensual
- fee premium por eventos tematicos
- conversion a listing marketplace
- patrocinio de semanas especiales

## Estrategia de lanzamiento
### Fase 1
- 4 a 8 lotes curados
- puja + chat + recordatorio + apertura
- lotes con categorias conocidas: Pokemon, Game Boy, Nintendo, SEGA

### Fase 2
- realtime real con WebSockets
- notificaciones email/push
- adjudicacion automatica
- borradores de listings para el ganador

### Fase 3
- ranking persistente
- badges
- temporadas tematicas
- contratos de almacenamiento completos

## Estado de implementacion en este repo
### Ya hecho
- nueva experiencia `/subastas`
- nuevas fichas `/subastas/[slug]`
- motor de pujas y extension
- chat y quick reactions
- recordatorios
- interes de compra / alquiler
- apertura de almacen
- export `.ics`
- documentacion tecnica

### Pendiente para produccion plena
- migrar de storage JSON a tablas SQL
- realtime real
- notificaciones transaccionales
- adjudicacion/checkout automatizados
- integracion directa con inventario de perfil
