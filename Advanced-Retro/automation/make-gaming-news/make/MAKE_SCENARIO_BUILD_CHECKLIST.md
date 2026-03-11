# Make Scenario Build Checklist

## Scenario A: Ingest + Content

1. `Google Sheets > Watch New Rows`
2. `Tools > Set variable (run_id)`
3. `Filter`: `estado = pendiente AND url_noticia != empty`
4. `Google Sheets > Update Row`
   - `estado=en_proceso`
   - `lock_uuid={{run_id}}`
5. `Perplexity (HTTP or app)`
6. `JSON > Parse JSON` (Perplexity)
7. `OpenAI > Create Chat Completion` (master prompt)
8. `JSON > Parse JSON` (GPT output)
9. `Google Sheets > Add/Update Row` in `news_content`
10. `Router`

## Router filters by channel

- Instagram: `publicar_instagram = TRUE`
- X: `publicar_x = TRUE`
- Facebook: `publicar_facebook = TRUE`
- LinkedIn: `publicar_linkedin = TRUE`
- YouTube: `publicar_youtube = TRUE`
- TikTok: `publicar_tiktok = TRUE`
- Vimeo: `publicar_vimeo = TRUE`
- Video branch: `usar_video = TRUE`

## Scenario B: Video Render (optional split)

1. `Webhook` (Custom webhook for Make) OR direct HTTP call from Scenario A
2. `HTTP > POST` to worker `/render`
3. `Sleep` 30-60s
4. `HTTP > GET /render/{job_id}`
5. Repeat until `status=done`
6. Update `news_content.video_url`

## End-state update

Always finish with one module per branch to update `news_queue`:

- success: `estado=publicado`, `error_detalle=`
- fail: `estado=error`, `intento_count + 1`, `error_detalle` with message

