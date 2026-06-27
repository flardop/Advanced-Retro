# RETROVILLE_CIRUGIA

Fecha: 27 de junio de 2026

## Alcance

Cirugía del home de `advancedretro.es/retroville` sin rediseño total:

- quitar duplicaciones
- reordenar jerarquía
- mover material de proceso fuera del pitch principal
- reforzar credibilidad comercial
- ajustar motion, navegación y metadatos

## Qué se ha eliminado del home y a dónde se ha movido

- Segunda entrada/hero duplicada: eliminada. El home ahora tiene una sola bienvenida con logo, frase y CTA.
- Texto flotante sobre el vídeo de ciudad: eliminado. El vídeo queda full-bleed, sin copy comercial superpuesto.
- Guías visuales, anatomy sheet y dev sheets del bloque principal: eliminadas del flujo comercial y concentradas en `/retroville/sketches`.
- Material de apoyo visual incrustado en la página de personajes: retirado del cast y movido a `/retroville/sketches`.
- Testimonios de comunidad tipo “Lucía / Rubén / Mara / Dani”: eliminados del home.
- Email personal visible `flardop44@gmail.com`: eliminado de las superficies públicas de Retroville tocadas en esta iteración y sustituido por `pitch@advancedretro.es`.
- Enlace de Reddit a perfil personal: eliminado de los canales oficiales de Retroville.

## Qué se ha añadido o modificado

- Nuevo home quirúrgico con este orden:
  - entrada cinematográfica
  - presentación del universo
  - 3 protagonistas
  - 3 episodios gancho
  - 3 distritos
  - buyer brief compacto
  - comunidad + evento
  - footer oficial
- Intro con stagger real:
  - logo 400ms
  - frase +200ms
  - CTA +400ms
- Scroll reveal con `IntersectionObserver` para bloques clave.
- Hover de personajes con `translateY(-4px)`.
- Hover de episodios con fondo `#1a0000` y título a blanco.
- Cursor custom rojo de 8px en desktop Retroville.
- Transición negra de 200ms entre rutas internas de Retroville.
- Navbar del home con `rgba(14,14,14,0.85)` y `backdrop-filter: blur(12px)`.
- Vídeo de ciudad con `preload="none"` y activación diferida por `IntersectionObserver`.
- Preload de logo, poster del vídeo y renders principales.
- Manifest e iconos propios de Retroville:
  - `public/icons/retroville/*`
- `canonical` mantenido sin query strings.
- Limpieza de `console.info` visible en producción dentro del shell de Retroville.

## Decisión sobre comunidad

Se han quitado los testimonios porque no había verificación clara de que fueran testimonios reales con permiso explícito. Se han sustituido por señal social verificable y útil:

- contador real de suscriptores de `La Señal`
- bloque de evento del primer reveal
- registro rápido + guardar evento en calendario

## Lighthouse

Referencia “before”:

- URL publicada: `https://advancedretro.es/retroville`
- Fecha de medición: 27 de junio de 2026

Referencia “after” válida:

- URL local de producción: `http://localhost:3902/retroville?fresh=lighthouse-prod-after`
- Importante: la medición buena es sobre `next start`, no sobre `next dev`

### Desktop

| Estado | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Before | 97 | 100 | 96 | 100 |
| After | 96 | 100 | 96 | 100 |

Notas desktop:

- Before LCP: `1.1 s`
- After LCP: `1.3 s`
- CLS after: `0`

### Mobile

| Estado | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Before | 83 | 100 | 96 | 100 |
| After | 76 | 100 | 96 | 100 |

Notas mobile:

- Before LCP: `4.6 s`
- After LCP: `7.2 s`
- CLS after: `0`

Resultado frente a objetivo mínimo pedido:

- Performance móvil `75`: cumplido con `76`
- Accessibility `95`: superado con `100`
- Best Practices `90`: superado con `96`
- SEO `100`: cumplido con `100`

## Structured data

- Lighthouse marca `Structured data is valid` tanto en la referencia publicada como en la build local final.
- La comprobación final en Google Rich Results Test queda recomendada tras publicar esta iteración, porque la URL definitiva aún no refleja estos cambios.

## Pendiente para la siguiente iteración

- Afinar más el LCP móvil del home si queremos margen extra por encima de `76`.
- Hacer la validación final en Rich Results Test sobre la URL publicada una vez desplegado.
- Revisar si se quiere actualizar también el correo heredado en superficies no-Retroville del sitio.
- Decidir si el componente legado `RetrovilleImmersiveExperience` debe archivarse o alinearse, aunque no participa en el home actual.
