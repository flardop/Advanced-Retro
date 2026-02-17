import ProductDetail from '@/components/sections/ProductDetail';

function parseBooleanQuery(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return parseBooleanQuery(value[0]);
  }
  if (!value) return false;
  const safe = String(value).trim().toLowerCase();
  return safe === '1' || safe === 'true' || safe === 'yes';
}

export default function ProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { complete?: string | string[] };
}) {
  const prefillComplete = parseBooleanQuery(searchParams?.complete);
  return <ProductDetail productId={params.id} prefillComplete={prefillComplete} />;
}
