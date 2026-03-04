type ImageSignature = 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp' | 'avif' | 'heic' | 'unknown';

const SIGNATURE_TO_MIME: Record<ImageSignature, string[]> = {
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  bmp: ['image/bmp'],
  avif: ['image/avif'],
  heic: ['image/heic', 'image/heif'],
  unknown: [],
};

const SIGNATURE_TO_EXT: Record<ImageSignature, string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  gif: ['gif'],
  webp: ['webp'],
  bmp: ['bmp'],
  avif: ['avif'],
  heic: ['heic', 'heif'],
  unknown: [],
};

type BlockedPattern = {
  label: string;
  pattern: RegExp;
};

const BLOCKED_MARKET_PATTERNS: BlockedPattern[] = [
  { label: 'GTA 5', pattern: /\bgta\s*(5|v)\b/i },
  { label: 'Grand Theft Auto V', pattern: /\bgrand\s+theft\s+auto\s*(5|v)\b/i },
  { label: 'EA FC / FIFA moderno', pattern: /\b((ea\s*fc|fifa)\s*2[3-9])\b/i },
  { label: 'Fortnite', pattern: /\bfortnite\b/i },
  { label: 'Valorant', pattern: /\bvalorant\b/i },
  { label: 'Warzone', pattern: /\bwarzone\b/i },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function startsWithBytes(data: Uint8Array, signature: number[]): boolean {
  if (data.length < signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (data[index] !== signature[index]) return false;
  }
  return true;
}

function readAscii(data: Uint8Array, start: number, length: number): string {
  if (start < 0 || length <= 0 || start + length > data.length) return '';
  return Buffer.from(data.subarray(start, start + length)).toString('ascii');
}

function detectFtypBrand(data: Uint8Array): string {
  if (data.length < 12) return '';
  const ftyp = readAscii(data, 4, 4);
  if (ftyp !== 'ftyp') return '';
  return readAscii(data, 8, 4).toLowerCase();
}

export function detectImageSignature(data: Uint8Array): ImageSignature {
  if (!data || data.length < 12) return 'unknown';
  if (startsWithBytes(data, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWithBytes(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (readAscii(data, 0, 6) === 'GIF87a' || readAscii(data, 0, 6) === 'GIF89a') return 'gif';
  if (readAscii(data, 0, 4) === 'RIFF' && readAscii(data, 8, 4) === 'WEBP') return 'webp';
  if (readAscii(data, 0, 2) === 'BM') return 'bmp';

  const brand = detectFtypBrand(data);
  if (brand === 'avif' || brand === 'avis') return 'avif';
  if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'heic';
  return 'unknown';
}

export function validateImageBinarySignature(params: {
  bytes: Uint8Array;
  mime: string;
  ext: string;
}): string | null {
  const signature = detectImageSignature(params.bytes);
  if (signature === 'unknown') {
    return 'El archivo no parece una imagen válida.';
  }

  const normalizedMime = String(params.mime || '').toLowerCase().trim();
  const normalizedExt = String(params.ext || '').toLowerCase().trim();

  const validMimes = SIGNATURE_TO_MIME[signature];
  const validExts = SIGNATURE_TO_EXT[signature];

  if (!validMimes.includes(normalizedMime)) {
    return 'El tipo de archivo no coincide con el contenido real de la imagen.';
  }
  if (!validExts.includes(normalizedExt)) {
    return 'La extensión del archivo no coincide con el contenido real de la imagen.';
  }

  return null;
}

export function findBlockedMarketplaceTerm(text: string): string | null {
  const normalized = normalizeText(String(text || ''));
  if (!normalized) return null;

  for (const blocked of BLOCKED_MARKET_PATTERNS) {
    if (blocked.pattern.test(normalized)) return blocked.label;
  }
  return null;
}

export function validateRetroListingText(input: {
  title?: string;
  description?: string;
  genre?: string;
}): string | null {
  const joined = `${String(input.title || '')} ${String(input.description || '')} ${String(input.genre || '')}`.trim();
  const blocked = findBlockedMarketplaceTerm(joined);
  if (blocked) {
    return `Contenido no permitido para esta tienda retro: ${blocked}.`;
  }
  return null;
}

export function validateListingImageName(fileName: string): string | null {
  const blocked = findBlockedMarketplaceTerm(fileName);
  if (!blocked) return null;
  return `Nombre de archivo no permitido para comunidad retro (${blocked}).`;
}

