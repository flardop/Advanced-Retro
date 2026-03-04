/**
 * Motor central de comisiones.
 * - Lee porcentajes desde variables de entorno.
 * - Soporta overrides por tipo de flujo (catálogo, mystery, comunidad).
 * - Devuelve desglose en céntimos para persistencia y reporting.
 */
export type CommissionSource = 'catalog' | 'mystery' | 'community';

type CommissionConfig = {
  source: CommissionSource;
  ratePercent: number;
};

export type CommissionBreakdown = {
  source: CommissionSource;
  ratePercent: number;
  baseCents: number;
  grossCents: number;
  amountCents: number;
  netCents: number;
};

const DEFAULT_RATE_BY_SOURCE: Record<CommissionSource, number> = {
  catalog: 5,
  mystery: 5,
  community: 5,
};

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function parseRateEnv(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const normalized = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(normalized)) return null;
  return clampRate(normalized);
}

export function resolveCommissionConfig(source: CommissionSource): CommissionConfig {
  // Prioridad de configuración:
  // 1) variable específica por flujo
  // 2) variable global
  // 3) valor por defecto del código
  const globalRate = parseRateEnv('STORE_COMMISSION_RATE_PERCENT');
  const specificRate =
    source === 'catalog'
      ? parseRateEnv('STORE_COMMISSION_RATE_CATALOG_PERCENT')
      : source === 'mystery'
        ? parseRateEnv('STORE_COMMISSION_RATE_MYSTERY_PERCENT')
        : parseRateEnv('STORE_COMMISSION_RATE_COMMUNITY_PERCENT');

  const fallback = DEFAULT_RATE_BY_SOURCE[source];
  const ratePercent = specificRate ?? globalRate ?? fallback;

  return {
    source,
    ratePercent: clampRate(ratePercent),
  };
}

export function computeCommission(options: {
  source: CommissionSource;
  baseCents: number;
  grossCents: number;
}): CommissionBreakdown {
  const { source } = options;
  const config = resolveCommissionConfig(source);

  const baseCents = Math.max(0, Math.round(Number(options.baseCents || 0)));
  const grossCents = Math.max(0, Math.round(Number(options.grossCents || 0)));
  // amountCents se limita al bruto para evitar inconsistencias por redondeo.
  const rawCommission = Math.round((baseCents * config.ratePercent) / 100);
  const amountCents = Math.max(0, Math.min(rawCommission, grossCents));
  const netCents = Math.max(0, grossCents - amountCents);

  return {
    source,
    ratePercent: config.ratePercent,
    baseCents,
    grossCents,
    amountCents,
    netCents,
  };
}
