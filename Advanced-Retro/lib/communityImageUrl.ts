const COMMUNITY_FALLBACK_IMAGES = [
  '/images/community/homemade/community-photo-001.jpeg',
  '/images/community/homemade/community-photo-002.jpeg',
  '/images/community/homemade/community-photo-003.jpeg',
  '/images/community/homemade/community-photo-004.jpeg',
  '/images/community/homemade/community-photo-005.jpeg',
  '/images/community/homemade/community-photo-006.jpeg',
  '/images/community/homemade/community-photo-007.jpeg',
  '/images/community/homemade/community-photo-008.jpeg',
  '/images/community/homemade/community-photo-009.jpeg',
  '/images/community/homemade/community-photo-010.jpeg',
  '/images/community/homemade/community-photo-011.jpeg',
  '/images/community/homemade/community-photo-012.jpeg',
  '/images/community/homemade/community-photo-013.jpeg',
  '/images/community/homemade/community-photo-014.jpeg',
  '/images/community/homemade/community-photo-015.jpeg',
  '/images/community/homemade/community-photo-016.jpeg',
  '/images/community/homemade/community-photo-017.jpeg',
  '/images/community/homemade/community-photo-018.jpeg',
  '/images/community/homemade/community-photo-019.jpeg',
  '/images/community/homemade/community-photo-020.jpeg',
  '/images/community/homemade/community-photo-021.jpeg',
  '/images/community/homemade/community-photo-022.jpeg',
  '/images/community/homemade/community-photo-023.jpeg',
  '/images/community/homemade/community-photo-024.jpeg',
  '/images/community/homemade/community-photo-025.jpeg',
  '/images/community/homemade/community-photo-026.jpeg',
  '/images/community/homemade/community-photo-027.jpeg',
  '/images/community/homemade/community-photo-028.jpeg',
  '/images/community/homemade/community-photo-029.jpeg',
  '/images/community/homemade/community-photo-030.jpeg',
  '/images/community/homemade/community-photo-031.jpeg',
  '/images/community/homemade/community-photo-032.jpeg',
  '/images/community/homemade/community-photo-033.jpeg',
  '/images/community/homemade/community-photo-034.jpeg',
  '/images/community/homemade/community-photo-035.jpeg',
  '/images/community/homemade/community-photo-036.jpeg',
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function parseImageCandidates(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const value = raw.trim();
    if (!value) return [];
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        // Fallback split below.
      }
    }
    return value
      .split(/[\n,;|]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isAllowedImageUrl(url: string): boolean {
  const value = String(url || '').trim();
  if (!value) return false;
  if (value.startsWith('/')) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  return /\.(jpg|jpeg|png|webp|gif|avif|heic|heif)(\?|#|$)/i.test(value);
}

function isGameDbStyleImage(url: string): boolean {
  const lower = String(url || '').toLowerCase();
  if (!lower) return true;
  return (
    lower.includes('thumbnails.libretro.com') ||
    lower.includes('/named_snaps/') ||
    lower.includes('/named_titles/') ||
    lower.includes('/named_boxarts/') ||
    lower.includes('igdb.com') ||
    lower.includes('mobygames') ||
    lower.includes('rawg')
  );
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getCommunityFallbackGallery(seed: string, count = 4): string[] {
  const total = COMMUNITY_FALLBACK_IMAGES.length;
  if (total === 0) return ['/logo.png'];
  const safeCount = Math.min(Math.max(count, 1), total);
  const start = hashSeed(seed || 'community') % total;
  const output: string[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    output.push(COMMUNITY_FALLBACK_IMAGES[(start + i) % total]);
  }
  return output;
}

export function resolveCommunityListingImages(raw: unknown, seed: string): string[] {
  const candidates = uniqueStrings(parseImageCandidates(raw)).filter(isAllowedImageUrl);
  const preferred = candidates.filter((url) => !isGameDbStyleImage(url));
  if (preferred.length > 0) return preferred.slice(0, 10);
  return getCommunityFallbackGallery(seed, 4);
}

export function resolveCommunityListingCover(raw: unknown, seed: string): string {
  return resolveCommunityListingImages(raw, seed)[0] || '/logo.png';
}

