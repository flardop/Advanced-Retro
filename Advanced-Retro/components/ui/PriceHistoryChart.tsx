'use client';

export type PriceHistoryPoint = {
  date: string;
  price: number; // cents
};

export type PriceHistoryMarketOverlay = {
  available: boolean;
  marketplaceId?: string;
  sampleSize?: number;
  totalResults?: number;
  minPrice?: number | null;
  medianPrice?: number | null;
  averagePrice?: number | null;
  maxPrice?: number | null;
  note?: string;
};

function formatEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function createLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    d += ` L ${points[index].x} ${points[index].y}`;
  }
  return d;
}

function createAreaPath(points: Array<{ x: number; y: number }>, chartBottom: number): string {
  if (points.length === 0) return '';

  const first = points[0];
  const last = points[points.length - 1];
  let d = `M ${first.x} ${chartBottom} L ${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index += 1) {
    d += ` L ${points[index].x} ${points[index].y}`;
  }
  d += ` L ${last.x} ${chartBottom} Z`;
  return d;
}

function isValidPrice(value: unknown): value is number {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export default function PriceHistoryChart({
  points,
  marketOverlay,
}: {
  points: PriceHistoryPoint[];
  marketOverlay?: PriceHistoryMarketOverlay | null;
}) {
  if (!Array.isArray(points) || points.length === 0) {
    return <p className="text-sm text-textMuted">No hay datos para la grafica.</p>;
  }

  const safePoints = [...points]
    .filter((point) => point?.date && Number.isFinite(point?.price) && point.price > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (safePoints.length === 0) {
    return <p className="text-sm text-textMuted">No hay datos validos para la grafica.</p>;
  }

  const width = 760;
  const height = 240;
  const paddingX = 34;
  const paddingY = 24;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const prices = safePoints.map((point) => point.price);
  const marketValues = [
    marketOverlay?.minPrice,
    marketOverlay?.medianPrice,
    marketOverlay?.averagePrice,
    marketOverlay?.maxPrice,
  ].filter(isValidPrice);

  const allPrices = [...prices, ...marketValues];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const spread = Math.max(1, maxPrice - minPrice);
  const toY = (price: number) => paddingY + (1 - (price - minPrice) / spread) * chartHeight;

  const coords = safePoints.map((point, index) => {
    const x =
      safePoints.length === 1
        ? width / 2
        : paddingX + (index / (safePoints.length - 1)) * chartWidth;
    const y = toY(point.price);
    return { x, y, point };
  });

  const linePath = createLinePath(coords);
  const areaPath = createAreaPath(coords, height - paddingY);

  const first = safePoints[0];
  const last = safePoints[safePoints.length - 1];
  const middle = safePoints[Math.floor(safePoints.length / 2)];
  const marketLines = marketOverlay?.available
    ? [
        { id: 'min', label: 'eBay mínimo', value: marketOverlay.minPrice, color: '#67e8f9' },
        { id: 'median', label: 'eBay mediana', value: marketOverlay.medianPrice, color: '#4be4d6' },
        { id: 'average', label: 'eBay media', value: marketOverlay.averagePrice, color: '#facc15' },
        { id: 'max', label: 'eBay máximo', value: marketOverlay.maxPrice, color: '#f472b6' },
      ].filter((item) => isValidPrice(item.value))
    : [];

  return (
    <div className="border border-line bg-surface p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Historico de precios">
        <defs>
          <linearGradient id="price-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff355e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff355e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <rect x={paddingX} y={paddingY} width={chartWidth} height={chartHeight} fill="transparent" stroke="#2d3039" />

        {marketLines.map((line) => {
          const y = toY(Number(line.value));
          return (
            <g key={line.id}>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke={line.color}
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.9"
              />
              <text
                x={width - paddingX - 4}
                y={y - 4}
                fill={line.color}
                fontSize="10"
                textAnchor="end"
              >
                {line.label}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#price-area)" /> : null}
        {linePath ? <path d={linePath} fill="none" stroke="#ff355e" strokeWidth="2.5" /> : null}

        {coords.map((coord, index) => (
          <circle
            key={`${coord.point.date}-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={2.8}
            fill="#0b0c10"
            stroke="#ff355e"
            strokeWidth="1.5"
          />
        ))}

        <text x={paddingX} y={height - 6} fill="#8f95a3" fontSize="11">
          {new Date(first.date).toLocaleDateString('es-ES')}
        </text>
        <text x={width / 2} y={height - 6} fill="#8f95a3" fontSize="11" textAnchor="middle">
          {new Date(middle.date).toLocaleDateString('es-ES')}
        </text>
        <text x={width - paddingX} y={height - 6} fill="#8f95a3" fontSize="11" textAnchor="end">
          {new Date(last.date).toLocaleDateString('es-ES')}
        </text>

        <text x={paddingX + 4} y={paddingY + 12} fill="#8f95a3" fontSize="11">
          Max: {formatEuro(maxPrice)}
        </text>
        <text x={paddingX + 4} y={height - paddingY - 8} fill="#8f95a3" fontSize="11">
          Min: {formatEuro(minPrice)}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-textMuted">
        <span>Puntos: {safePoints.length}</span>
        <span>
          Actual: <span className="text-primary">{formatEuro(last.price)}</span>
        </span>
      </div>

      {marketOverlay ? (
        <div className="mt-3 rounded-lg border border-line bg-[rgba(10,18,30,0.45)] p-2.5 text-xs text-textMuted">
          {marketOverlay.available ? (
            <>
              <p>
                eBay · {marketOverlay.marketplaceId || 'Marketplace'} · Muestras: {Number(marketOverlay.sampleSize || 0)}
                {Number(marketOverlay.totalResults || 0) > 0
                  ? ` · Resultados: ${Number(marketOverlay.totalResults || 0)}`
                  : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="chip">Mín: {isValidPrice(marketOverlay.minPrice) ? formatEuro(Number(marketOverlay.minPrice)) : '—'}</span>
                <span className="chip">Mediana: {isValidPrice(marketOverlay.medianPrice) ? formatEuro(Number(marketOverlay.medianPrice)) : '—'}</span>
                <span className="chip">Media: {isValidPrice(marketOverlay.averagePrice) ? formatEuro(Number(marketOverlay.averagePrice)) : '—'}</span>
                <span className="chip">Máx: {isValidPrice(marketOverlay.maxPrice) ? formatEuro(Number(marketOverlay.maxPrice)) : '—'}</span>
              </div>
            </>
          ) : (
            <p>No se pudo cargar eBay{marketOverlay.note ? `: ${marketOverlay.note}` : ''}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
