'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { toCurrency, toPercent } from '@/lib/admin/format';

function useAnimatedNumber(value: number) {
  const [current, setCurrent] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = previousValue.current;
    const delta = value - from;
    const duration = 650;
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + delta * eased;
      previousValue.current = next;
      setCurrent(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return current;
}

export default function StatCard({
  label,
  value,
  trend,
  icon,
  format = 'number',
}: {
  label: string;
  value: number;
  trend?: number;
  icon: ReactNode;
  format?: 'number' | 'currency';
}) {
  const animated = useAnimatedNumber(value);
  const displayValue = useMemo(() => {
    if (format === 'currency') return toCurrency(animated);
    return Math.round(animated).toLocaleString('es-ES');
  }, [animated, format]);

  const positive = (trend || 0) >= 0;

  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--admin-text)]">{displayValue}</p>
        </div>
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-3 text-[var(--admin-primary)]">
          {icon}
        </div>
      </div>
      {typeof trend === 'number' ? (
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${positive ? 'bg-[rgba(34,197,94,0.12)] text-[var(--admin-success)]' : 'bg-[rgba(239,68,68,0.12)] text-[var(--admin-error)]'}`}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {toPercent(trend)} vs período anterior
        </div>
      ) : null}
    </div>
  );
}
