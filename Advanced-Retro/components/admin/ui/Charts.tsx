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

const palette = ['#6c63ff', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444', '#60a5fa'];

function ChartShell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      {title ? <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">{title}</h3> : null}
      <div className="h-[320px]">{children}</div>
    </div>
  );
}

function AdminTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-2 text-xs text-[var(--admin-text)] shadow-2xl">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
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
              <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6c63ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip content={<AdminTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke="#6c63ff" fill="url(#adminAreaFill)" strokeWidth={2.5} />
        </ReAreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BarChart({ data, title, dataKey = 'value', horizontal = false }: { data: ChartPoint[]; title?: string; dataKey?: string; horizontal?: boolean }) {
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis type={horizontal ? 'number' : 'category'} dataKey={horizontal ? undefined : 'label'} stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis type={horizontal ? 'category' : 'number'} dataKey={horizontal ? 'label' : undefined} width={horizontal ? 120 : 40} stroke="#94a3b8" tickLine={false} axisLine={false} />
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
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip content={<AdminTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke="#a78bfa" strokeWidth={3} dot={false} />
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
