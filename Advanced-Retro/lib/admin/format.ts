import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function toCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format((Number(cents || 0) || 0) / 100);
}

export function toPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function toDateLabel(value: string | Date | null | undefined, pattern = 'dd MMM yyyy') {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function toDateTimeLabel(value: string | Date | null | undefined, pattern = 'dd MMM yyyy HH:mm') {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function toRelativeLabel(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: es });
}

export function slugifyAdmin(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function truncate(value: string | null | undefined, max = 120) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
