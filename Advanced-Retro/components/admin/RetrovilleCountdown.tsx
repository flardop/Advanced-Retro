'use client';

import { useEffect, useMemo, useState } from 'react';

function getRemaining(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function RetrovilleCountdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const items = useMemo(
    () => [
      ['Días', remaining.days],
      ['Horas', remaining.hours],
      ['Min', remaining.minutes],
      ['Seg', remaining.seconds],
    ],
    [remaining]
  );

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={String(label)} className="rounded-[1.4rem] border border-white/15 bg-white/5 px-5 py-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="font-mono text-4xl font-bold text-white">{String(value).padStart(2, '0')}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/65">{label}</p>
        </div>
      ))}
    </div>
  );
}
