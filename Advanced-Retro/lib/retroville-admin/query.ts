export function buildRetrovilleAdminQuery(
  basePath: string,
  params: Record<string, string | number | boolean | null | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    searchParams.set(key, normalized);
  });

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
