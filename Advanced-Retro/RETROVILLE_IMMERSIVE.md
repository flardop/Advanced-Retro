# RETROVILLE_IMMERSIVE

## Dependencias usadas

- `three@0.179.1`
- `@react-three/fiber@8.18.0`
- `@react-three/drei@9.122.0`
- `@react-three/postprocessing@2.19.1`
- `postprocessing@6.39.1`
- `gsap@3.15.0`
- `leva@0.9.36`

## Lo que se ha construido

- Nueva entrada inmersiva para `/retroville` con escena procedural en tiempo real.
- Ciudad generada sin assets 3D externos: geometria irregular extruida, grid rojo, particulas y postprocesado.
- Intro cinematografica con progress bar, blur inicial, vuelo de camara y scroll narrativo.
- Audio procedural discreto con ruido filtrado, drone a 40 Hz y crackles aleatorios, activado solo tras interaccion.
- Dossier debajo de la escena con:
  - distritos
  - personajes principales
  - rail de guias visuales
  - pulso de comunidad
  - registro al reveal + guardado del evento
  - biblia privada por popup
  - redes y rutas de descubrimiento

## Decisiones tomadas en zonas ambiguas

- El CTA final `ENTRAR A RETROVILLE` no navega a otra ruta porque ya estamos en `/retroville`.
  - Se ha resuelto como salto suave al dossier vivo dentro de la misma pagina.
- El titulo principal se ha planteado como overlay tipografico cinematografico en vez de `TextGeometry` real.
  - Motivo: mantener `Bebas Neue` exacta, control visual y menos friccion de font assets 3D.
- La version movil mantiene la atmosfera pero simplifica la carga.
  - Menos edificios y menos particulas.
  - La aberracion cromatica queda anulada.
- `Leva` queda integrada para tuning interno, pero oculta en la interfaz final.

## Lighthouse

Se pudo ejecutar Lighthouse, pero sobre la vista de desarrollo local en `localhost`, no sobre un deploy final optimizado.

Resultado orientativo sobre preview local:

- Performance: `43`
- Accessibility: `96`
- Best Practices: `92`
- SEO: `100`
- FCP: `1.5 s`
- LCP: `20.3 s`
- TBT: `7360 ms`
- CLS: `0`
- Speed Index: `3.7 s`

Lectura honesta:

- La accesibilidad, SEO y estabilidad visual estan bien.
- El cuello de botella claro esta en la escena y el hilo principal.
- Esa cifra de performance no debe tomarse como la nota final de produccion porque se saco en preview local y con una escena WebGL pesada.

## Que cambiaria con modelos `.glb` reales

- Mejoraria de inmediato la lectura de skyline, profundidad y siluetas.
- Los landmarks podrian vender mejor el tono de serie y dejarian de sentirse tan abstractos.
- Los personajes podrian entrar dentro de la escena como entidades reales, no solo como paneles flotantes.
- La direccion artistica ganaria mucha identidad si los materiales, props y vehiculos compartieran un lenguaje modelado coherente.

## Mejora visual estimada con assets 3D reales

- Mejora percibida estimada: `+40%` a `+55%`.

No porque la base actual sea floja, sino porque ahora mismo la experiencia vende atmosfera, ritmo y tono; con `.glb` reales empezaria a vender tambien detalle de mundo, autoria y acabado de estudio.

## Pendiente para segunda iteracion

- Afinar el scroll narrativo para que algunos overlays no convivan tanto tiempo en transiciones medias.
- Meter mas landmarks arquitectonicos unicos dentro de la ciudad procedural.
- Sustituir algunos cubos hero por formas mas reconocibles del universo Retroville.
- Añadir version de audio con capas mas ricas y mezcla contextual por tramo.
- Optimizar mas el coste del campo de particulas y del compositor.
- Revisar una pasada de responsive fino en moviles pequenos y portatiles bajos.
- Si se confirma esta direccion, integrar personajes o props `.glb` reales en puntos concretos del recorrido.
