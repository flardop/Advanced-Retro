'use client';

import { useEffect, useState } from 'react';

type CountdownUnit = {
  label: string;
  value: string;
};

function getTimeLeft(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, finished: diff <= 0 };
}

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, '0');
}

const placeholderUnits: CountdownUnit[] = [
  { label: 'Días', value: '--' },
  { label: 'Horas', value: '--' },
  { label: 'Minutos', value: '--' },
  { label: 'Segundos', value: '--' },
];

export default function RetrovilleCountdown({
  targetIso,
  className = '',
}: {
  targetIso: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(targetIso));
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  const units: CountdownUnit[] = !mounted || !timeLeft
    ? placeholderUnits
    : [
        { label: 'Días', value: pad(timeLeft.days) },
        { label: 'Horas', value: pad(timeLeft.hours) },
        { label: 'Minutos', value: pad(timeLeft.minutes) },
        { label: 'Segundos', value: pad(timeLeft.seconds) },
      ];

  if (mounted && timeLeft?.finished) {
    return (
      <div
        className={`rounded-[2rem] border border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.06)] px-6 py-8 text-center shadow-[0_0_30px_rgba(0,255,136,0.08)] ${className}`}
      >
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--rv-green)]">Estado de lanzamiento</p>
        <p className="mt-3 text-2xl font-semibold text-[var(--rv-text)]">Retroville ya está despierto.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {units.map((unit) => (
          <div key={unit.label} className="flex min-w-[96px] flex-col items-center gap-2 sm:min-w-[132px]">
            <span
              className="text-[clamp(3rem,8vw,6rem)] font-black leading-none text-[var(--rv-text)] [font-family:var(--font-mono)]"
              style={{ animation: 'number-pulse 2s ease-in-out infinite' }}
              suppressHydrationWarning
            >
              {unit.value}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--rv-text-muted)]">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
