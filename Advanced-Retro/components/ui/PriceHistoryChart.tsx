'use client';
import { useState } from 'react';

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
  comparables?: Array<{
    price?: number | null;
    listingDate?: string | null;
  }>;
};

function formatEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatAxisEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPointDateLabel(dateIso: string): string {
  const date = new Date(dateIso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatPointDateTime(dateIso: string): string {
  const date = new Date(dateIso);
  if (!Number.isFinite(date.getTime())) return dateIso;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function isValidPrice(value: unknown): value is number {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function chooseAxisStepCents(maxCents: number): number {
  const maxEuro = Math.max(1, Math.ceil(maxCents / 100));

  if (maxEuro <= 20) return 500; // 5€
  if (maxEuro <= 100) return 1000; // 10€
  if (maxEuro <= 300) return 2500; // 25€
  if (maxEuro <= 800) return 5000; // 50€
  if (maxEuro <= 1500) return 10000; // 100€
  return 25000; // 250€
}

export default function PriceHistoryChart({
  points,
  marketOverlay,
}: {
  points: PriceHistoryPoint[];
  marketOverlay?: PriceHistoryMarketOverlay | null;
}) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!Array.isArray(points) || points.length === 0) {
    return <p className="text-sm text-textMuted">No hay datos para la grafica.</p>;
  }

  const safePoints = [...points]
    .filter((point) => point?.date && Number.isFinite(point?.price) && point.price > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (safePoints.length === 0) {
    return <p className="text-sm text-textMuted">No hay datos validos para la grafica.</p>;
  }

  const overlayComparablePoints = (() => {
    if (!marketOverlay?.available || !Array.isArray(marketOverlay.comparables)) return [] as PriceHistoryPoint[];

    const comparableRows = marketOverlay.comparables
      .map((item) => ({
        price: Number(item?.price || 0),
        date:
          typeof item?.listingDate === 'string' && item.listingDate
            ? String(item.listingDate)
            : null,
      }))
      .filter((row) => Number.isFinite(row.price) && row.price > 0);

    if (comparableRows.length < 2) return [] as PriceHistoryPoint[];

    return comparableRows
      .map((row, index) => ({
        date:
          row.date && Number.isFinite(new Date(row.date).getTime())
            ? new Date(row.date).toISOString()
            : new Date(
                Date.now() - (comparableRows.length - 1 - index) * 24 * 60 * 60 * 1000
              ).toISOString(),
        price: Math.round(row.price),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const overlayStatPoints = (() => {
    if (!marketOverlay?.available) return [] as PriceHistoryPoint[];

    const statValues = [
      Number(marketOverlay.minPrice || 0),
      Number(marketOverlay.medianPrice || 0),
      Number(marketOverlay.averagePrice || 0),
      Number(marketOverlay.maxPrice || 0),
    ]
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Math.round(value));

    const uniqueSorted = [...new Set(statValues)].sort((a, b) => a - b);
    if (uniqueSorted.length < 2) return [] as PriceHistoryPoint[];

    const now = Date.now();
    const start = now - (uniqueSorted.length - 1) * 24 * 60 * 60 * 1000;
    return uniqueSorted.map((price, index) => ({
      date: new Date(start + index * 24 * 60 * 60 * 1000).toISOString(),
      price,
    }));
  })();

  // Safety net: if backend returns a single current point, render eBay trend with comparables/stats.
  const displayPoints =
    safePoints.length <= 1
      ? overlayComparablePoints.length >= 2
        ? overlayComparablePoints
        : overlayStatPoints.length >= 2
          ? overlayStatPoints
          : safePoints
      : safePoints;

  const width = 760;
  const height = 320;
  const paddingLeft = 64;
  const paddingRight = 24;
  const paddingTop = 16;
  const paddingBottom = 72;
  const chartLeft = paddingLeft;
  const chartRight = width - paddingRight;
  const chartTop = paddingTop;
  const chartBottom = height - paddingBottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const prices = displayPoints.map((point) => point.price);
  const marketValues = [
    marketOverlay?.minPrice,
    marketOverlay?.medianPrice,
    marketOverlay?.averagePrice,
    marketOverlay?.maxPrice,
  ].filter(isValidPrice);

  const allPrices = [...prices, ...marketValues];
  const dataMaxPrice = Math.max(...allPrices);
  const axisMinPrice = 0;
  const axisStep = chooseAxisStepCents(dataMaxPrice);
  const axisMaxPrice = Math.max(axisStep, Math.ceil(dataMaxPrice / axisStep) * axisStep);
  const spread = Math.max(1, axisMaxPrice - axisMinPrice);
  const toY = (price: number) => chartTop + (1 - (price - axisMinPrice) / spread) * chartHeight;

  const yTicks: number[] = [];
  for (let value = axisMinPrice; value <= axisMaxPrice; value += axisStep) {
    yTicks.push(value);
  }

  const pointCoords = displayPoints.map((point, index) => {
    const x =
      displayPoints.length === 1
        ? width / 2
        : chartLeft + (index / (displayPoints.length - 1)) * chartWidth;
    const y = toY(point.price);
    return { x, y, point };
  });

  const lineCoords = pointCoords.map((coord) => ({ x: coord.x, y: coord.y }));
  const linePath = createLinePath(lineCoords);

  const maxXTicks = Math.min(8, Math.max(2, pointCoords.length));
  const xTickIndexesRaw =
    pointCoords.length <= maxXTicks
      ? pointCoords.map((_, index) => index)
      : Array.from({ length: maxXTicks }, (_, index) =>
          Math.round((index * Math.max(0, pointCoords.length - 1)) / Math.max(1, maxXTicks - 1))
        );
  const xTickIndexes = [...new Set(xTickIndexesRaw)];
  const xTicks = xTickIndexes.map((index) => {
    const point = displayPoints[index];
    const coord = pointCoords[index];
    const label = formatPointDateLabel(point.date);
    return { x: coord.x, label };
  });

  const last = displayPoints[displayPoints.length - 1];
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
        <rect x={chartLeft} y={chartTop} width={chartWidth} height={chartHeight} fill="transparent" stroke="#2d3039" />

        {yTicks.map((tick) => {
          const y = toY(tick);
          return (
            <g key={`tick-${tick}`}>
              <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#233045" strokeWidth="1" />
              <text x={chartLeft - 8} y={y + 4} fill="#8f95a3" fontSize="10" textAnchor="end">
                {formatAxisEuro(tick)}
              </text>
            </g>
          );
        })}

        {xTicks.map((tick, index) => (
          <g key={`xtick-${index}`}>
            <line x1={tick.x} x2={tick.x} y1={chartTop} y2={chartBottom} stroke="#233045" strokeWidth="1" />
            <text
              x={tick.x}
              y={height - 14}
              fill="#8f95a3"
              fontSize="11"
              textAnchor="middle"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {marketLines.map((line) => {
          const y = toY(Number(line.value));
          return (
            <g key={line.id}>
              <line
                x1={chartLeft}
                x2={chartRight}
                y1={y}
                y2={y}
                stroke={line.color}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text
                x={chartRight - 4}
                y={y - 4}
                fill={line.color}
                fontSize="9"
                textAnchor="end"
              >
                {line.label}
              </text>
            </g>
          );
        })}

        {linePath ? <path d={linePath} fill="none" stroke="#5d8bff" strokeWidth="2.6" /> : null}

        {pointCoords.map((coord, index) => (
          <circle
            key={`${coord.point.date}-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={4.2}
            fill="#5d8bff"
            stroke="#d9e5ff"
            strokeWidth="1"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHoveredPointIndex(index)}
            onMouseLeave={() => setHoveredPointIndex((current) => (current === index ? null : current))}
          />
        ))}
        {hoveredPointIndex !== null && pointCoords[hoveredPointIndex] ? (
          (() => {
            const point = pointCoords[hoveredPointIndex];
            const boxWidth = 200;
            const boxHeight = 44;
            const x = Math.min(Math.max(point.x + 10, chartLeft), chartRight - boxWidth);
            const y = Math.min(Math.max(point.y - boxHeight - 10, chartTop + 6), chartBottom - boxHeight - 6);
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={boxWidth}
                  height={boxHeight}
                  rx={8}
                  fill="#0a1424"
                  stroke="#2d4f73"
                />
                <text x={x + 10} y={y + 18} fill="#dbe7ff" fontSize="11">
                  {formatPointDateTime(point.point.date)}
                </text>
                <text x={x + 10} y={y + 34} fill="#4be4d6" fontSize="12" fontWeight="700">
                  {formatEuro(point.point.price)}
                </text>
              </g>
            );
          })()
        ) : null}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-textMuted">
        <span>Puntos: {displayPoints.length}</span>
        <span>
          Rango: {formatAxisEuro(axisMinPrice)} - {formatAxisEuro(axisMaxPrice)}
        </span>
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
