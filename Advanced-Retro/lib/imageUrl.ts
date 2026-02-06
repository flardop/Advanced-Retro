const PLACEHOLDER = '/placeholder.svg';

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

export function getProductImageUrl(product: any): string {
  const fromArray = product?.images?.[0];
  const fromSingle = product?.image;
  const candidate = fromArray ?? fromSingle;
  return isValidImageUrl(candidate) ? candidate : PLACEHOLDER;
}

export function getProductImageUrls(product: any): string[] {
  const raw = product?.images ?? (product?.image ? [product.image] : []);
  const valid = raw.filter(isValidImageUrl);
  return valid.length ? valid : [PLACEHOLDER];
}
