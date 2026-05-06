import { NextResponse } from 'next/server';
import { getProductImageUrl, getProductImageUrls } from '@/lib/imageUrl';
import { getPublicCatalogProducts } from '@/lib/publicCatalog';
import { getProductHref } from '@/lib/productUrl';
import { absoluteUrl } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

function escapeXml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value: unknown): string {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toGoogleAvailability(stock: number): string {
  return Number(stock || 0) > 0 ? 'in_stock' : 'out_of_stock';
}

function isMerchantEligibleProduct(product: any): boolean {
  const title = String(product?.name || '').trim();
  const description = stripHtml(product?.long_description || product?.description || '');
  const haystack = `${title} ${description}`.toLowerCase();
  const blockedTerms = ['falso', 'fake', 'falsificacion', 'falsificación', 'repro', 'replica', 'réplica'];
  const priceCents = Math.max(0, Number(product?.price || 0));
  const imageUrl = String(getProductImageUrl(product) || '').trim();
  const status = String(product?.status || '').trim().toLowerCase();

  if (!title || priceCents <= 0 || !imageUrl) return false;
  if (status === 'draft' || status === 'archived' || status === 'deleted') return false;
  if (blockedTerms.some((term) => haystack.includes(term))) return false;
  return true;
}

function buildGoogleProductItem(product: any): string | null {
  const id = String(product?.id || '').trim();
  const title = String(product?.name || '').trim();
  if (!id || !title) return null;

  const priceCents = Math.max(0, Number(product?.price || 0));
  const link = absoluteUrl(getProductHref(product));
  const primaryImage = absoluteUrl(getProductImageUrl(product));
  const additionalImages = getProductImageUrls(product)
    .map((entry) => absoluteUrl(entry))
    .filter((entry) => entry !== primaryImage)
    .slice(0, 5);
  const description = stripHtml(product?.long_description || product?.description || title).slice(0, 5000);
  const productType = [product?.category, product?.platform, product?.edition].map((entry) => String(entry || '').trim()).filter(Boolean).join(' > ');

  return [
    '  <item>',
    `    <g:id>${escapeXml(id)}</g:id>`,
    `    <title>${escapeXml(title)}</title>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <g:image_link>${escapeXml(primaryImage)}</g:image_link>`,
    ...additionalImages.map((image) => `    <g:additional_image_link>${escapeXml(image)}</g:additional_image_link>`),
    `    <g:availability>${escapeXml(toGoogleAvailability(product?.stock))}</g:availability>`,
    `    <g:price>${escapeXml(`${(priceCents / 100).toFixed(2)} EUR`)}</g:price>`,
    '    <g:condition>used</g:condition>',
    '    <g:brand>AdvancedRetro.es</g:brand>',
    '    <g:identifier_exists>false</g:identifier_exists>',
    productType ? `    <g:product_type>${escapeXml(productType)}</g:product_type>` : null,
    product?.category ? `    <g:custom_label_0>${escapeXml(String(product.category))}</g:custom_label_0>` : null,
    product?.platform ? `    <g:custom_label_1>${escapeXml(String(product.platform))}</g:custom_label_1>` : null,
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function GET() {
  const { products } = await getPublicCatalogProducts(5000);
  const items = products
    .filter((product) => isMerchantEligibleProduct(product))
    .map((product) => buildGoogleProductItem(product))
    .filter((item): item is string => Boolean(item));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    '    <title>AdvancedRetro.es product feed</title>',
    '    <link>https://advancedretro.es/tienda</link>',
    '    <description>Feed de productos de Advanced Retro para listados orgánicos y Merchant Center.</description>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
    },
  });
}
