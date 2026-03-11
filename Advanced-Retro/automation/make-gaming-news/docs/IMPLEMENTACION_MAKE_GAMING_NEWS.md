# 1. RESUMEN DEL OBJETIVO

Construir y adaptar tu escenario existente de Make para que tome URLs de noticias gaming desde Google Sheets, analice cada noticia con Perplexity, genere contenido multi-red con GPT y publique en redes. Ademas, dejar preparada una rama de video para render automatico en mp4 vertical (voz, musica, subtitulos, CTA suave a AdvancedRetro.es).

---

# 2. ESTRUCTURA RECOMENDADA DEL GOOGLE SHEETS

Usa dos hojas:

- `news_queue` (entrada y control de ejecucion)
- `news_content` (salida generada y enlaces publicados)

## Hoja `news_queue`

| Columna | Tipo | Uso |
|---|---|---|
| id_noticia | texto | ID unico tipo `NEWS-0001` |
| fecha_alta | fecha-hora | Fecha de alta manual |
| url_noticia | texto | URL de la noticia |
| fuente | texto | Dominio fuente |
| tema | texto | categoria: lanzamiento, parche, rumor, etc. |
| juego | texto | nombre del juego |
| plataforma | texto | PC, PS5, Xbox, Switch, multi |
| idioma | texto | `es` o `en` |
| prioridad | numero | 1-5 |
| usar_video | boolean | activar rama de video |
| publicar_instagram | boolean | switch por canal |
| publicar_tiktok | boolean | switch por canal |
| publicar_youtube | boolean | switch por canal |
| publicar_x | boolean | switch por canal |
| publicar_facebook | boolean | switch por canal |
| publicar_linkedin | boolean | switch por canal |
| publicar_vimeo | boolean | switch por canal |
| fecha_programada | fecha-hora | para programacion |
| estado | texto | pendiente, en_proceso, publicado, error |
| intento_count | numero | contador de reintentos |
| error_detalle | texto largo | causa del ultimo error |
| lock_uuid | texto | evita ejecucion duplicada |

## Hoja `news_content`

| Columna | Tipo | Uso |
|---|---|---|
| id_noticia | texto | clave de union |
| titulo_final | texto | titular final |
| resumen_noticia | texto largo | resumen final |
| hook | texto | hook de reel |
| guion_reel | texto largo | guion 15-20s |
| subtitulos_srt | texto largo | SRT final |
| caption_instagram | texto largo | copy IG |
| post_x | texto | copy X |
| post_facebook | texto largo | copy FB |
| post_linkedin | texto largo | copy LinkedIn |
| descripcion_youtube | texto largo | copy Shorts |
| hashtags_json | texto | hashtags por red en JSON |
| cta_final | texto | CTA suave |
| video_url | texto | mp4 final |
| thumb_url | texto | miniatura |
| published_urls | texto | JSON con URLs publicadas |
| updated_at | fecha-hora | control de version |

Plantillas listas en:
- `automation/make-gaming-news/templates/news_queue_template.csv`
- `automation/make-gaming-news/templates/news_content_template.csv`

---

# 3. ESTRUCTURA DEL ESCENARIO EN MAKE

## Flujo base modulo por modulo

1. `Google Sheets > Watch New Rows` en `news_queue`
2. `Filter`:
   - `estado = pendiente`
   - `url_noticia != empty`
3. `Google Sheets > Update a Row`:
   - `estado = en_proceso`
   - `lock_uuid = {{uuid()}}`
4. `Perplexity (HTTP o app)` con prompt de analisis
5. `JSON > Parse JSON` del analisis
6. `OpenAI > Create Chat Completion` con prompt maestro
7. `JSON > Parse JSON` de salida GPT
8. `Google Sheets > Add/Update Row` en `news_content`
9. `Router` por canal

## Rama Instagram

- Filtro `publicar_instagram = TRUE`
- Si `usar_video = TRUE` y `video_url != empty`: publicar reel
- Si no: publicar post/carrusel con caption

## Rama X

- Filtro `publicar_x = TRUE`
- Publicar por API via `HTTP > Make a request`

## Rama LinkedIn

- Filtro `publicar_linkedin = TRUE`
- Publicar texto o video segun disponibilidad

## Rama Facebook

- Filtro `publicar_facebook = TRUE`
- Publicar post o reel segun disponibilidad

## Rama YouTube Shorts

- Filtro `publicar_youtube = TRUE`
- Requiere `video_url`
- Subida por modulo YouTube

## Rama TikTok

- Filtro `publicar_tiktok = TRUE`
- Implementar por API HTTP o integrador externo

## Rama Vimeo (opcional)

- Filtro `publicar_vimeo = TRUE`
- Subida de mp4

## Rama video (interna)

1. Filtro `usar_video = TRUE`
2. `HTTP POST` a `video-worker /render`
3. Polling `GET /render/{job_id}` hasta `done`
4. Guardar `video_url` en `news_content`

## Cierre

- `Google Sheets > Update row` en `news_queue`:
  - `estado = publicado` o `estado = error`
  - `error_detalle`
  - `intento_count`

---

# 4. QUE CAMBIOS DEBES HACER SOBRE TU ESCENARIO ACTUAL

## Reutiliza

- Trigger de Google Sheets
- Router base
- Conexiones OAuth ya existentes
- Modulos OpenAI actuales (cambiando prompt y formato JSON)

## Reemplaza o mejora

- Prompts de producto -> prompts de noticia gaming
- Campos de control (`estado`, `lock_uuid`, `intento_count`)
- Manejo de errores por rama
- Publicacion X/TikTok por HTTP si tu cuenta no tiene modulo directo
- Rama video con webhook a worker externo

---

# 5. PROMPT RECOMENDADO PARA PERPLEXITY

Archivo listo:

- `automation/make-gaming-news/prompts/01_perplexity_news_analysis.txt`

Uso en Make:

- Mapea `{{1.url_noticia}}` desde Google Sheets.
- Espera salida JSON.
- Pasa por `JSON Parse` antes de GPT.

---

# 6. PROMPT MAESTRO PARA GPT / MAKE AI AGENT

Archivo listo:

- `automation/make-gaming-news/prompts/02_gpt_master_make_agent.txt`

Uso en Make:

- Inserta el JSON parseado de Perplexity en `{{5.parsed_json}}`.
- Define `response_format` JSON estricto si el modulo lo soporta.
- Parsea salida antes de enrutar por canal.

---

# 7. PROMPTS ESPECIFICOS POR RED SOCIAL

Archivos listos:

- Instagram: `automation/make-gaming-news/prompts/03_instagram_prompt.txt`
- X: `automation/make-gaming-news/prompts/04_x_prompt.txt`
- Facebook: `automation/make-gaming-news/prompts/05_facebook_prompt.txt`
- LinkedIn: `automation/make-gaming-news/prompts/06_linkedin_prompt.txt`
- YouTube Shorts: `automation/make-gaming-news/prompts/07_youtube_shorts_prompt.txt`

Recomendacion:

- Mantener un solo prompt maestro para casi todo y usar estos prompts por red solo si quieres afinar tono final.

---

# 8. DISENO DE LA RAMA DE VIDEO

Implementada en esta carpeta:

- `automation/make-gaming-news/video-worker/`

Componentes:

1. `worker-server.mjs`
   - API para recibir jobs y consultar estado.
2. `render-news-video.mjs`
   - Render real con FFmpeg: vertical 1080x1920, subtitulos, mezcla de voz y musica.
3. `payload.example.json`
   - payload de ejemplo para Make.
4. `README.md`
   - despliegue rapido.

Flujo:

- Make envia JSON a `POST /render`
- Worker responde `job_id`
- Make hace polling `GET /render/{job_id}`
- Cuando termina, obtiene `video_url` o ruta local

---

# 9. PROPUESTA DE FLUJO CON FFMPEG

Objetivo tecnico:

- video vertical `1080x1920`
- clips de 3-5s
- transiciones cortas
- subtitulos incrustados
- voz + musica
- salida `mp4` H264 + AAC

La implementacion ya queda en:

- `automation/make-gaming-news/video-worker/render-news-video.mjs`

Reglas clave del renderer:

- normaliza cada clip a `1080x1920` con `scale + crop`
- usa `xfade` para transicion entre clips
- aplica subtitulos SRT si existen
- mezcla audio con `amix` (voz dominante, musica baja)
- exporta `-pix_fmt yuv420p` para compatibilidad social

---

# 10. EJEMPLO DE OUTPUT FINAL

Titulo:
`Starfall Protocol confirma lanzamiento en octubre para PC y consolas`

Resumen:
`Iron Orbit confirma ventana de lanzamiento en octubre para PC, PS5 y Xbox Series. Tambien anuncia beta cerrada para verano. No hay precio oficial confirmado.`

Instagram:
`Nuevo RPG tactico sci-fi en camino. Starfall Protocol llega en octubre a PC, PS5 y Xbox Series, con beta cerrada en verano. Si te gusta la estrategia por turnos, apunta este nombre. Mas noticias y retro gaming en AdvancedRetro.es #GamingNews #RPG #PS5 #XboxSeries #PCGaming #Videojuegos`

X:
`Starfall Protocol llega en octubre a PC/PS5/Xbox Series y tendra beta en verano. RPG tactico sci-fi con buena pinta. Mas noticias en AdvancedRetro.es #GamingNews #RPG`

LinkedIn:
`El anuncio de Starfall Protocol confirma una tendencia clara: estudios medianos apostando por RPG tacticos multiplataforma desde el dia uno. Si cumplen calidad y rendimiento, puede ser un caso interesante de nicho premium. Descubre mas en AdvancedRetro.es #GamingIndustry #Videojuegos #RPG`

Guion reel 18s:
- 0-3s: "Atencion, nuevo RPG tactico confirmado para este ano"
- 3-13s: "Starfall Protocol llega en octubre a PC, PS5 y Xbox Series. Habra beta cerrada en verano"
- 13-18s: "Si te gusta la estrategia por turnos, este apunta fuerte. Mas contenido en AdvancedRetro.es"

CTA final:
`Mas contenido gaming y retro en AdvancedRetro.es`

---

# 11. ERRORES TIPICOS Y COMO EVITARLOS

| Error | Prevencion |
|---|---|
| Doble publicacion de una fila | `estado + lock_uuid` y filtro estricto |
| JSON invalido desde IA | parse intermedio + fallback de error |
| Timeouts en escenarios largos | separa contenido/publicacion/video |
| Fallos por limites API | reintentos con backoff exponencial |
| OAuth expirado | chequeo semanal y alertas por 401/403 |
| Video rechazado por red | forzar H264/AAC, 1080x1920, duracion valida |
| Fila bloqueada en error | escenario de reproceso por `estado=error` |

---

# 12. PRIMERA VERSION MINIMA VIABLE

Orden recomendado:

1. Solo contenido y publicacion en 2-3 redes (sin video):
   - Sheets -> Perplexity -> GPT -> Instagram/Facebook/LinkedIn
2. Anadir control de estados, errores y reintentos
3. Activar YouTube Shorts con video manual temporal
4. Activar rama video automatica con worker FFmpeg
5. Anadir TikTok y X por API HTTP con credenciales finales

Checklist MVP:

- [ ] Plantillas CSV cargadas en Google Sheets
- [ ] Prompts pegados en Make
- [ ] JSON parse funcionando
- [ ] Publicacion de prueba en una red
- [ ] Logs de error y reintento activos

