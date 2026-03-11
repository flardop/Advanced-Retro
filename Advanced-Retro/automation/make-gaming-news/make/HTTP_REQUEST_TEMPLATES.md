# HTTP request templates for Make

## 1) Trigger render job

Method: `POST`
URL: `https://<tu-worker>/render`
Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <WORKER_TOKEN>` (optional but recomendado)

Body (Raw JSON):

```json
{
  "job_id": "{{1.id_noticia}}",
  "output_name": "{{1.id_noticia}}.mp4",
  "clips": [
    {
      "url": "https://cdn.tu-dominio.com/clips/clip1.mp4",
      "duration_sec": 5
    },
    {
      "url": "https://cdn.tu-dominio.com/clips/clip2.mp4",
      "duration_sec": 5
    }
  ],
  "voice_url": "https://cdn.tu-dominio.com/audio/{{1.id_noticia}}-voice.mp3",
  "music_url": "https://cdn.tu-dominio.com/audio/base-track.mp3",
  "subtitles_srt": "{{replace(6.subtitulos_srt; \"\\n\"; \"\\n\")}}",
  "transition_sec": 0.3,
  "music_volume": 0.12,
  "voice_volume": 1.0
}
```

## 2) Poll render status

Method: `GET`
URL: `https://<tu-worker>/render/{{2.job_id}}`
Headers:
- `Authorization: Bearer <WORKER_TOKEN>`

Expected response:

```json
{
  "job_id": "NEWS-0001",
  "status": "done",
  "output_path": "/app/output/NEWS-0001.mp4",
  "video_url": "https://<tu-worker>/files/NEWS-0001.mp4"
}
```

## 3) Fallback for X publication (HTTP)

Method: `POST`
URL: `https://api.x.com/2/tweets`
Headers:
- `Authorization: Bearer <X_BEARER_TOKEN>`
- `Content-Type: application/json`

Body:

```json
{
  "text": "{{6.post_x}}"
}
```

Nota: valida permisos de cuenta API y rate limits en X.

