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
      { label: 'Min', value: pad(timeLeft.minutes) },
      { label: 'Seg', value: pad(timeLeft.seconds) },
    ];
  }, [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds]);

  if (timeLeft.finished) {
    return (
      <div
        className={`rounded-[1.6rem] border border-fuchsia-400/25 bg-[rgba(110,32,138,0.14)] px-5 py-4 text-center backdrop-blur-xl ${className}`}
      >
        <p className="text-[11px] uppercase tracking-[0.28em] text-fuchsia-200/75">
          Estado de lanzamiento
        </p>
        <p className="mt-2 text-base font-semibold text-white">
          Retroville ya está despierto.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[1.7rem] border border-white/10 bg-[rgba(8,12,24,0.62)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl ${className}`}
    >
      <div className="mb-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.26em] text-white/48 sm:text-[11px]">
        <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
        Secuencia de lanzamiento
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-2 py-3 text-center"
          >
            <span className="block text-xl font-black tabular-nums text-white [text-shadow:0_0_18px_rgba(255,255,255,0.18)] sm:text-2xl">
              {unit.value}
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.22em] text-white/42 sm:text-[10px]">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
