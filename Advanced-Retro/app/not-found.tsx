'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setScore((s) => s + 1), 200);
    return () => clearInterval(timer);
  }, []);

  const move = (dx: number, dy: number) => {
    setPos((p) => ({
      x: Math.min(95, Math.max(5, p.x + dx)),
      y: Math.min(95, Math.max(5, p.y + dy)),
    }));
  };

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-8">
          <h1 className="title-display text-4xl mb-2">404 — MINI RUNNER</h1>
          <p className="text-textMuted mb-6">Evita los bordes. Score: {score}</p>
          <div className="relative w-full aspect-video border border-line bg-surface">
            <div
              className="absolute w-3 h-3 bg-primary"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button className="button-secondary" onClick={() => move(-5, 0)}>←</button>
            <button className="button-secondary" onClick={() => move(5, 0)}>→</button>
            <button className="button-secondary" onClick={() => move(0, -5)}>↑</button>
            <button className="button-secondary" onClick={() => move(0, 5)}>↓</button>
          </div>
          <div className="flex gap-3 mt-6">
            <Link href="/" className="button-primary">Volver al inicio</Link>
            <Link href="/tienda" className="button-secondary">Ir a tienda</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
