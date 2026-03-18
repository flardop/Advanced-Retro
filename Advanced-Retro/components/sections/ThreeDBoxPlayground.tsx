'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/components/sections/ThreeDBoxPlayground.module.css';

type BoxPreset = {
  id: string;
  label: string;
  image: string;
  spine: string;
};

const PRESETS: BoxPreset[] = [
  {
    id: 'gb',
    label: 'Game Boy DMG',
    image: '/images/products/console-gb-dmg.jpg',
    spine: 'GAME BOY CLASSIC',
  },
  {
    id: 'gbc',
    label: 'Game Boy Color',
    image: '/images/products/console-gbc.jpg',
    spine: 'GAME BOY COLOR',
  },
  {
    id: 'gba',
    label: 'Game Boy Advance',
    image: '/images/products/console-gba.jpg',
    spine: 'GAME BOY ADVANCE',
  },
  {
    id: 'snes',
    label: 'Super Nintendo',
    image: '/images/products/console-snes-pal.jpg',
    spine: 'SUPER NINTENDO',
  },
  {
    id: 'gc',
    label: 'GameCube',
    image: '/images/products/console-gamecube.jpg',
    spine: 'NINTENDO GAMECUBE',
  },
];

const BOX_WIDTH = 250;
const BOX_HEIGHT = 360;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function ThreeDBoxPlayground() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [autoSpin, setAutoSpin] = useState(true);
  const [speedDegPerSec, setSpeedDegPerSec] = useState(18);
  const [depth, setDepth] = useState(34);
  const [perspective, setPerspective] = useState(1200);
  const [rotation, setRotation] = useState(18);
  const [tiltX, setTiltX] = useState(-7);
  const [tiltY, setTiltY] = useState(-10);

  const activePreset = useMemo(
    () => PRESETS.find((preset) => preset.id === presetId) || PRESETS[0],
    [presetId]
  );

  useEffect(() => {
    if (!autoSpin) return;
    let raf = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const delta = now - prev;
      prev = now;
      setRotation((current) => (current + (delta * speedDegPerSec) / 1000) % 360);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, speedDegPerSec]);

  const boxStyle = useMemo(
    () =>
      ({
        '--box-w': `${BOX_WIDTH}px`,
        '--box-h': `${BOX_HEIGHT}px`,
        '--box-d': `${depth}px`,
      }) as CSSProperties,
    [depth]
  );

  const sceneStyle = useMemo(
    () => ({ '--perspective': `${perspective}px` } as CSSProperties),
    [perspective]
  );

  const rigTransform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  const boxTransform = `rotateY(${rotation}deg)`;

  return (
    <div className={styles.wrap}>
      <div className={styles.layout}>
        <aside className={styles.controls}>
          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Caja / portada</label>
            <select
              className={styles.select}
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Velocidad de giro: {speedDegPerSec}°/s</label>
            <input
              className={styles.range}
              type="range"
              min={4}
              max={55}
              step={1}
              value={speedDegPerSec}
              onChange={(event) => setSpeedDegPerSec(clamp(Number(event.target.value || 0), 4, 55))}
            />
          </div>

          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Profundidad de caja: {depth}px</label>
            <input
              className={styles.range}
              type="range"
              min={18}
              max={64}
              step={1}
              value={depth}
              onChange={(event) => setDepth(clamp(Number(event.target.value || 0), 18, 64))}
            />
          </div>

          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Perspectiva: {perspective}px</label>
            <input
              className={styles.range}
              type="range"
              min={700}
              max={1800}
              step={10}
              value={perspective}
              onChange={(event) => setPerspective(clamp(Number(event.target.value || 0), 700, 1800))}
            />
          </div>

          <div className={styles.actions}>
            <button className="button-primary" onClick={() => setAutoSpin((v) => !v)}>
              {autoSpin ? 'Pausar giro' : 'Activar giro'}
            </button>
            <button
              className="button-secondary"
              onClick={() => {
                setRotation(18);
                setTiltX(-7);
                setTiltY(-10);
              }}
            >
              Reset vista
            </button>
          </div>

          <p className="text-xs text-textMuted">
            Demo ligera para validar si te gusta el efecto 3D antes de aplicarlo en fichas de producto reales.
          </p>
        </aside>

        <div
          className={styles.sceneShell}
          onPointerMove={(event) => {
            const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
            const nx = (event.clientX - rect.left) / rect.width;
            const ny = (event.clientY - rect.top) / rect.height;
            setTiltY((nx - 0.5) * 24);
            setTiltX((0.5 - ny) * 18);
          }}
          onPointerLeave={() => {
            setTiltX(-7);
            setTiltY(-10);
          }}
        >
          <div className={styles.scene} style={sceneStyle}>
            <div className={styles.rig} style={{ transform: rigTransform }}>
              <div className={styles.box} style={{ ...boxStyle, transform: boxTransform }}>
                <div
                  className={`${styles.face} ${styles.front}`}
                  style={{ backgroundImage: `url(${activePreset.image})` }}
                />
                <div
                  className={`${styles.face} ${styles.back}`}
                  style={{ backgroundImage: `url(${activePreset.image})` }}
                />
                <div className={`${styles.face} ${styles.sideLeft}`}>
                  <span className={styles.spineText}>{activePreset.spine}</span>
                </div>
                <div className={`${styles.face} ${styles.sideRight}`}>
                  <span className={styles.spineText}>{activePreset.spine}</span>
                </div>
                <div className={`${styles.face} ${styles.top}`} />
                <div className={`${styles.face} ${styles.bottom}`} />
                <div className={styles.shadow} />
              </div>
            </div>
          </div>

          <div className={styles.meta}>
            <span>{activePreset.label}</span>
            <span className={styles.chip}>{autoSpin ? 'Animación ON' : 'Animación OFF'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
