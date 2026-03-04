/**
 * Utilidad para convertir una URL de vídeo (YouTube/Vimeo)
 * en un formato embebible seguro para UI.
 */
export type VideoProvider = 'youtube' | 'vimeo';

export type VideoEmbedData = {
  provider: VideoProvider;
  id: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
};

function normalizeRawVideoUrl(input: string): string {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9_-]{8,}$/i.test(raw)) {
    // Si llega solo un ID, se asume YouTube.
    return `https://www.youtube.com/watch?v=${raw}`;
  }
  return '';
}

function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host.includes('youtu.be')) {
    const pathId = url.pathname.replace(/^\/+/, '').split('/')[0];
    return pathId || null;
  }

  if (host.includes('youtube.com')) {
    const v = url.searchParams.get('v');
    if (v) return v;

    const parts = url.pathname.split('/').filter(Boolean);
    const embedIndex = parts.findIndex((part) => part === 'embed' || part === 'shorts' || part === 'live');
    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
  }

  return null;
}

function extractVimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!host.includes('vimeo.com')) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(parts[i])) return parts[i];
  }
  return null;
}

export function parseVideoEmbed(input: unknown): VideoEmbedData | null {
  const normalized = normalizeRawVideoUrl(String(input || ''));
  if (!normalized) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const youtubeId = extractYouTubeId(parsed);
  if (youtubeId) {
    return {
      provider: 'youtube',
      id: youtubeId,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  const vimeoId = extractVimeoId(parsed);
  if (vimeoId) {
    return {
      provider: 'vimeo',
      id: vimeoId,
      watchUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: null,
    };
  }

  return null;
}
