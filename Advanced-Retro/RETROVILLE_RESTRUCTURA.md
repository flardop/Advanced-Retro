# RETROVILLE_RESTRUCTURA

Fecha de revisión: 2026-06-21

## 1. Transición elegida para la pantalla amarilla

Elección: cortina lateral ámbar.

Motivo:

- Era la opción más cinematográfica sin meter una capa 3D innecesaria.
- Permite que el logo respire solo en pantalla antes de abrir la ciudad.
- Es ligera de ejecutar, fácil de controlar entre 600 ms y 1200 ms y no introduce un corte seco.
- Se guarda en `sessionStorage` cuando el entorno lo permite; si el navegador embebido bloquea storage, la entrada sigue funcionando con degradación segura.

## 2. Implementación elegida para el descenso a la ciudad

Elección: parallax por capas con `position: sticky` y progreso por scroll.

Motivo:

- El proyecto ya tenía una prueba previa con WebGL/Three.js y era más costosa de mantener para el rendimiento objetivo.
- Había assets reales suficientes para construir sensación de descenso sin motor 3D completo.
- La versión final usa capas reales del universo y evita los PNG más pesados en el home principal.
- El scroll queda absorbido por la secuencia porque el bloque ocupa varios viewports y solo libera la navegación normal al terminar el descenso.

## 3. Nueva estructura de navegación

Home `/retroville`

- Entrada ámbar de sesión única.
- Secuencia de descenso a ciudad.
- Bloque de serie.
- Bloque principal de personajes.
- Preview de episodios.
- Bloque de ciudad/worldbuilding.
- Pulso de comunidad + registro de evento.
- Materiales privados + redes.

Páginas separadas

- `/retroville/personajes`: protagonistas, secundarios e incoming con jerarquía clara.
- `/retroville/episodios`: temporada 1 separada del home y bloque T2 incoming.

Navegación visible nueva

- `Serie`
- `Personajes`
- `Episodios`
- `Ciudad`
- `Comunidad`
- `Cast completo`
- `T1`
- `AdvancedRetro`

## 4. Contenido de personajes ampliado para revisar

Estos textos se han expandido a partir del material ya existente y conviene revisarlos editorialmente:

- `La Profesora / Nona`
- `Jow & Andrew`
- `La Mafia`

Nota importante de asset:

- `public/images/retroville/dev-characters/nona-girl-sheet.png` está duplicado con `nano-sheet.png`, así que La Profesora se ha dejado como incoming sin imagen fiable en vez de forzar un render erróneo.

## 5. Lighthouse Performance

Referencia `before`

- Origen medido: `https://advancedretro.es/retroville`
- Fecha: 2026-06-21

Referencia `after`

- Origen medido: build de producción local en `http://localhost:3041/retroville`
- Fecha: 2026-06-21

### Desktop

| Estado | Performance | FCP | LCP | Speed Index | TBT | CLS |
| --- | ---: | --- | --- | --- | --- | --- |
| Before | 71 | 1.9 s | 2.3 s | 7.3 s | 0 ms | 0.003 |
| After | 97 | 0.4 s | 1.2 s | 0.4 s | 0 ms | 0 |

### Mobile

| Estado | Performance | FCP | LCP | Speed Index | TBT | CLS |
| --- | ---: | --- | --- | --- | --- | --- |
| Before | 76 | 2.4 s | 3.9 s | 11.4 s | 10 ms | 0.017 |
| After | 77 | 1.5 s | 6.3 s | 1.5 s | 20 ms | 0 |

Lectura rápida:

- Desktop mejora mucho al pasar de la versión publicada a la nueva build local.
- Mobile queda razonable pero todavía es la parte con más margen, sobre todo por el peso visual del arranque y del primer bloque de ciudad.
- Para llegar a una móvil más sólida todavía conviene una segunda pasada específica sobre assets y jerarquía de cargas del home.

## 6. Ajustes técnicos importantes aplicados

- Tipografía de títulos llevada a `Bebas`.
- Fuentes servidas localmente para no depender de fetch en build.
- El monospace técnico ha quedado local con `JetBrains Mono` como solución de estabilidad de build; si se quiere volver a `Space Mono`, la siguiente iteración debería autohospedarla de forma explícita.
- Home reescrita sobre un componente nuevo: `RetrovilleStudioExperience`.
- Nuevas fuentes de datos compartidas en `app/retroville/content.ts`.
- Sección de comunidad mantenida con registro y guardado de evento.
- Biblia privada mantenida por popup y correo.

## 7. Pendiente para la siguiente iteración

- Volver a `Space Mono` autohospedada si quieres cerrar la identidad tipográfica exacta.
- Optimizar aún más mobile en el primer bloque del home.
- Revisar y validar los copy expansions de los incoming.
- Sustituir el asset correcto de La Profesora / Nona cuando exista.
- Revisar si merece la pena simplificar todavía más el shell global de Retroville para quitar detalles heredados que no aporten al pitch.
