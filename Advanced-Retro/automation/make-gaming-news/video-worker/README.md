# Video Worker (Make + FFmpeg)

Servicio HTTP minimal para render de videos verticales de noticias gaming.

## Requisitos

- Node.js 18+
- FFmpeg y FFprobe instalados y en PATH

Comprobar:

```bash
ffmpeg -version
ffprobe -version
```

## Variables de entorno

- `PORT` (default `8088`)
- `WORKER_TOKEN` (opcional, recomendado)
- `PUBLIC_BASE_URL` (opcional, para devolver URL publica fija)
- `VIDEO_OUTPUT_DIR` (opcional)
- `VIDEO_JOBS_DIR` (opcional)

## Ejecutar

```bash
cd Advanced-Retro
npm run make:video-worker
```

## Endpoints

- `GET /health`
- `POST /render`
- `GET /render/:job_id`
- `GET /files/:filename`

## Ejemplo local sin Make

```bash
cd Advanced-Retro
node automation/make-gaming-news/video-worker/render-news-video.mjs \
  --payload automation/make-gaming-news/video-worker/payload.example.json \
  --output-dir automation/make-gaming-news/video-worker/output \
  --job-id DEMO-LOCAL
```

## Payload

Consulta `payload.example.json`.

Campos principales:

- `clips[]`: lista de clips (url o ruta local) con `duration_sec`
- `voice_url`: voz en off (opcional)
- `music_url`: musica de fondo (opcional)
- `subtitles_srt`: texto SRT (opcional)
- `transition_sec`: duracion transicion (ej. `0.3`)
- `music_volume`: volumen musica (ej. `0.12`)
- `voice_volume`: volumen voz (ej. `1.0`)

## Integracion con Make

1. `HTTP POST` a `/render` con JSON.
2. Guardar `job_id`.
3. `Sleep` 20-40s.
4. `HTTP GET /render/{job_id}` hasta `status=done`.
5. Usar `video_url` para publicar en redes.

