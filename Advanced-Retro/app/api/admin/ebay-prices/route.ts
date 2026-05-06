import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getAdminSettingsMap, getSettingValue } from '@/lib/admin/settings';

export async function POST(request: NextRequest) {
  return withAdminRoute(async () => {
    const payload = await request.json();
    const keywords = String(payload.keywords || '').trim();
    if (!keywords) throw new Error('Debes indicar palabras clave');

    const settings = await getAdminSettingsMap();
    const apiKey = getSettingValue(settings, 'ebay_api_key', '');
    if (!apiKey) throw new Error('No hay eBay API key configurada en admin settings');

    const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
    url.searchParams.set('q', keywords);
    url.searchParams.set('limit', '30');
    url.searchParams.set('filter', 'conditions:{USED|NEW}');
    url.searchParams.set('sort', 'newlyListed');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.errors?.[0]?.message || 'No se pudo consultar la API de eBay');
    }

    const items = Array.isArray(json.itemSummaries) ? json.itemSummaries : [];
    const prices = items
      .map((item: any) => Number(item.price?.value || 0))
      .filter((value: number) => Number.isFinite(value) && value > 0);

    const average = prices.length ? prices.reduce((sum: number, value: number) => sum + value, 0) / prices.length : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;

    return {
      average,
      min,
      max,
      suggested: average > 0 ? average * 0.98 : 0,
      listings: items.map((item: any) => ({
        title: item.title,
        price: Number(item.price?.value || 0),
        currency: item.price?.currency,
        itemWebUrl: item.itemWebUrl,
        condition: item.condition,
      })),
    };
  });
}
