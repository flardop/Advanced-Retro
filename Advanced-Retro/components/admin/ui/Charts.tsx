'use client';

import {
  Area,
  AreaChart as ReAreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartPoint } from '@/types/admin';

const palette = [
  'var(--admin-primary)',
  'var(--admin-accent)',
  'var(--admin-success)',
  'var(--admin-warning)',
  'var(--admin-error)',
  '#60a5fa',
];

const RETROVILLE_PATH_LABELS: Record<string, string> = {
  '/retroville': 'Home',
  '/retroville/personajes': 'Personajes',
  '/retroville/episodios': 'Episodios',
  '/retroville/sketches': 'Sketchbook',
  '/retroville/guias': 'Guías',
  '/retroville/comunidad': 'Comunidad',
  '/retroville/presentaciones': 'Presentación',
  '/retroville/press': 'Press kit',
  '/retroville/legal': 'Legal',
  '/retroville/faq': 'FAQ',
};

function humanizeChartLabel(value: string | number | null | undefined) {
  const raw = String(value || '').trim();
  if (!raw) return 'Dato';
  if (RETROVILLE_PATH_LABELS[raw]) return RETROVILLE_PATH_LABELS[raw];

  return raw
    .replace(/^Solicitar · /i, 'Solicitud · ')
    .replace(/^Previa · /i, 'Popup · ')
    .replace(/^Newsletter · retroville reveal card$/i, 'Newsletter · Reveal')
    .replace(/^Reveal · retroville reveal card$/i, 'Reveal · Registro')
    .replace(/^Acceso privado · .*$/i, 'Acceso privado')
    .replace(/^Calendario · google$/i, 'Calendario · Google')
    .replace(/^Calendario · ics$/i, 'Calendario · ICS')
    .replace(/visión/gi, 'Vision')
    .replace(/^retroville_/i, '')
    .replace(/^\/retroville\/?/i, '')
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function shortenChartLabel(value: string | number | null | undefined, maxLength = 28) {
  const normalized = humanizeChartLabel(value);
  if (normalized.length <= maxLength) return normalized;

  const trimmed = normalized.slice(0, maxLength - 1);
  const compact = trimmed.replace(/[\s·_-]+[^·\s_-]*$/, '').trim();
  return `${compact || trimmed}…`;
}

function ChartShell({
  title,
  children,
  heightClass = 'h-[320px]',
  heightStyle,
}: {
  title?: string;
  children: React.ReactNode;
  heightClass?: string;
  heightStyle?: React.CSSProperties;
}) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      {title ? <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">{title}</h3> : null}
      <div className={heightClass} style={heightStyle}>{children}</div>
    </div>
  );
}

function AdminTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-2 text-xs text-[var(--admin-text)] shadow-2xl">
      {label ? <p className="mb-1 font-semibold">{humanizeChartLabel(label)}</p> : null}
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function AreaChart({ data, title, dataKey = 'value' }: { data: ChartPoint[]; title?: string; dataKey?: string }) {
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data}>
          <defs>
            <linearGradient id="adminAreaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => shortenChartLabel(value, 14)} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip content={<AdminTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke="var(--admin-primary)" fill="url(#adminAreaFill)" strokeWidth={2.5} />
        </ReAreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BarChart({ data, title, dataKey = 'value', horizontal = false }: { data: ChartPoint[]; title?: string; dataKey?: string; horizontal?: boolean }) {
  const horizontalHeight = Math.min(720, Math.max(420, data.length * 46 + 86));

  return (
    <ChartShell
      title={title}
      heightClass={horizontal ? 'h-auto min-h-[420px]' : 'h-[320px]'}
      heightStyle={horizontal ? { height: horizontalHeight } : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 8, right: 18, bottom: 8, left: 10 } : undefined}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : 'label'}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={horizontal ? undefined : (value) => shortenChartLabel(value, 12)}
          />
          <YAxis
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? 'label' : undefined}
            width={horizontal ? 260 : 40}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 11 }}
            tickFormatter={horizontal ? (value) => shortenChartLabel(value, 18) : undefined}
            tickMargin={8}
          />
          <Tooltip content={<AdminTooltip />} />
          <Bar dataKey={dataKey} radius={[10, 10, 10, 10]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function LineChart({ data, title, dataKey = 'value' }: { data: ChartPoint[]; title?: string; dataKey?: string }) {
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => shortenChartLabel(value, 12)} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip content={<AdminTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke="var(--admin-primary)" strokeWidth={3} dot={false} />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function DonutChart({ data, title }: { data: ChartPoint[]; title?: string }) {
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<AdminTooltip />} />
          <Legend />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={72} outerRadius={110} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
