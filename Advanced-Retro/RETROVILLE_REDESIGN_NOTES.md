# RETROVILLE_REDESIGN_NOTES

## Archivos modificados

- `components/retroville/RetrovilleExperience.tsx`
- `components/retroville/RetrovilleImmersiveExperience.tsx`
- `components/retroville/RetrovilleImmersiveScene.tsx`
- `components/retroville/retroville-immersive.module.css`
- `components/retroville/retroville-shell.module.css`
- `lib/retroville/fonts.ts`
- `styles/retroville.css`

## Componentes creados o introducidos en esta etapa

- `RetrovilleImmersiveExperience`
- `RetrovilleImmersiveScene`

## Contenido de Retroville reutilizado

- Lore base del proyecto: ciudad de hardware olvidado, segunda oportunidad, humor oscuro y caos social.
- Personajes reales ya presentes en el proyecto: NOX, LUNA, Button Crew, Mayor Tube, Nora, Joy & Grump, Nano, Pipo y CRUX.
- Guias visuales reales y dev sheets ya existentes en `public/images/retroville/`.
- Material de worldbuilding ya existente: `masterplan`, `central plaza`, `bit grave`, `cinema district`, `metro pod`, `urban props`, `nox house`.
- Redes, discovery links, waitlist y mecanismos de reveal ya existentes en `app/retroville/shared.ts` y componentes de newsletter.

## Partes nuevas visualmente

- Hero inmersivo con escena WebGL procedural, intro cinematografica y overlays editoriales.
- Dossier inferior reorganizado como landing de worldbuilding con:
  - concepto editorial
  - distritos
  - cast principal
  - residentes secundarios
  - rail ampliado de guias visuales
  - mundo y tono
  - galeria de visual development
  - registro al reveal
  - popup privado para la biblia
  - redes + cierre teaser

## Placeholders o partes provisionales

- La skyline 3D y los landmarks del hero siguen siendo una escena procedural, no un set final con modelos `.glb`.
- El bloque `Season 1 playbook` sigue bloqueado como `incoming`.
- Parte del cast extendido usa `dev sheets` y concept boards reales, pero no todos los elementos tienen render final de presentacion uniforme.
- El pulso de comunidad mezcla fotos reales del pool local con avatares de iniciales cuando toca fallback.

## Como volver a la version anterior

Se guardo una copia de seguridad clara en:

- `private/backups/retroville-redesign-20260618-222513/`

Dentro hay copias de las rutas clave anteriores:

- `app-retroville/`
- `components-retroville/`
- `lib-retroville/`

Para revertir manualmente:

1. Copia desde `private/backups/retroville-redesign-20260618-222513/app-retroville/` a `app/retroville/` los archivos que quieras restaurar.
2. Copia desde `private/backups/retroville-redesign-20260618-222513/components-retroville/` a `components/retroville/` los componentes que quieras restaurar.
3. Si quieres recuperar la tipografia anterior, usa `private/backups/retroville-redesign-20260618-222513/lib-retroville/fonts.ts`.

## Lo que falta para una version final mas profesional

- Sustituir la escena procedural por landmarks y props 3D finales del universo.
- Unificar mas renders finales del cast secundario para que toda la landing tenga el mismo nivel de acabado.
- Afinar rendimiento del hero WebGL en equipos mas modestos.
- Preparar una biblia privada real o press dossier definitivo para el popup.
- Hacer una pasada final de direccion de arte con assets cinematicos hechos expresamente para la landing.
