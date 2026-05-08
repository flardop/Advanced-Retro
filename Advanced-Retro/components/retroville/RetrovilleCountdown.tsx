'use client';

import { useEffect, useMemo, useState } from 'react';

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

export default function RetrovilleCountdown({
  targetIso,
  className = '',
}: {
  targetIso: string;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetIso));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetIso));
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  const units = useMemo<CountdownUnit[]>(() => {
    return [
      { label: 'Días', value: pad(timeLeft.days) },
      { label: 'Horas', value: pad(timeLeft.hours) },
      { label: 'Minutos', value: pad(timeLeft.minutes) },
      { label: 'Segundos', value: pad(timeLeft.seconds) },
    ];
  }, [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds]);

  if (timeLeft.finished) {
    return (
      <div className={`rounded-[1.8rem] border border-fuchsia-400/30 bg-fuchsia-400/10 px-6 py-5 text-center ${className}`}>
        <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200/80">Retroville está despierto</p>
        <p className="mt-3 text-lg font-semibold text-white">La cuenta atrás terminó. El universo ya está listo para abrir sus puertas.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}>
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-[1.8rem] border border-white/10 bg-[rgba(8,10,18,0.82)] px-4 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-3 py-4">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
            <span className="block text-3xl font-black tracking-[0.18em] text-white sm:text-4xl [text-shadow:0_0_24px_rgba(255,255,255,0.24)]">
              {unit.value}
            </span>
          </div>
          <span className="mt-3 block text-[11px] uppercase tracking-[0.24em] text-slate-400">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
