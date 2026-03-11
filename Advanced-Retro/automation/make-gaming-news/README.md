# Make Gaming News Automation Pack

Paquete listo para adaptar tu escenario de Make y publicar noticias gaming en varias redes.

## Incluye

- `templates/`: CSV para `news_queue` y `news_content`
- `prompts/`: prompts listos para Perplexity, GPT y redes
- `make/`: checklists y plantillas HTTP para armar el escenario
  - incluye `scenario_blueprint_template.json` y `field_mapping_reference.json`
- `docs/`: guia completa de implementacion en formato 1-12
- `video-worker/`: worker HTTP + renderer FFmpeg para video automatico
- `payloads/`: payload de ejemplo para pruebas

## Arranque rapido

1. Importa `templates/news_queue_template.csv` y `templates/news_content_template.csv` en Google Sheets.
2. Copia prompts desde `prompts/` a tus modulos de Make.
3. Monta el escenario con `make/MAKE_SCENARIO_BUILD_CHECKLIST.md`.
4. Si quieres video automatico, arranca el worker:

```bash
cd Advanced-Retro
npm run make:video-worker
```

5. En Make, llama por HTTP a `POST /render` y haz polling a `GET /render/{job_id}`.

## Archivos clave

- Guia principal: `docs/IMPLEMENTACION_MAKE_GAMING_NEWS.md`
- Prompt Perplexity: `prompts/01_perplexity_news_analysis.txt`
- Prompt maestro GPT: `prompts/02_gpt_master_make_agent.txt`
- Worker API: `video-worker/worker-server.mjs`
- Renderer FFmpeg: `video-worker/render-news-video.mjs`
