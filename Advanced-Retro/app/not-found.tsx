'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number };

type LeaderboardItem = {
  display_name: string;
  best_score: number;
  games_played: number;
  updated_at: string;
};

type Direction = 'up' | 'down' | 'left' | 'right';

const BOARD_SIZE = 20;
const TICK_MS = 120;
const INITIAL_SNAKE: Point[] = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

function randomApple(snake: Point[]): Point {
  const occupied = new Set(snake.map((item) => `${item.x}:${item.y}`));
  const candidates: Point[] = [];
  for (let x = 0; x < BOARD_SIZE; x += 1) {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      const key = `${x}:${y}`;
      if (!occupied.has(key)) candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return { x: 0, y: 0 };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function movePoint(head: Point, direction: Direction): Point {
  if (direction === 'up') return { x: head.x, y: head.y - 1 };
  if (direction === 'down') return { x: head.x, y: head.y + 1 };
  if (direction === 'left') return { x: head.x - 1, y: head.y };
  return { x: head.x + 1, y: head.y };
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  );
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export default function NotFound() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [apple, setApple] = useState<Point>(() => randomApple(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>('right');
  const [pendingDirection, setPendingDirection] = useState<Direction>('right');
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserBest, setCurrentUserBest] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);
  const saveTriggeredRef = useRef(false);

  const head = snake[0];

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/game/snake/leaderboard', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
      setIsAuthenticated(Boolean(data?.isAuthenticated));
      setCurrentUserBest(
        Number.isFinite(Number(data?.currentUserBest)) ? Number(data.currentUserBest) : null
      );
    } catch {
      // Sin bloqueo visual en 404.
    }
  }, []);

  const resetGame = useCallback(() => {
    const nextSnake = [...INITIAL_SNAKE];
    setSnake(nextSnake);
    setApple(randomApple(nextSnake));
    setDirection('right');
    setPendingDirection('right');
    setScore(0);
    setRunning(true);
    setGameOver(false);
    setSaveMessage('');
    saveTriggeredRef.current = false;
  }, []);

  const submitScore = useCallback(
    async (finalScore: number) => {
      if (saveTriggeredRef.current || finalScore <= 0) return;
      saveTriggeredRef.current = true;
      setIsSavingScore(true);
      try {
        const res = await fetch('/api/game/snake/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: finalScore }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setSaveMessage('Inicia sesión para guardar tu score en el TOP.');
          return;
        }
        if (!res.ok) {
          setSaveMessage('No se pudo guardar el score. Inténtalo de nuevo.');
          return;
        }

        if (data?.newPersonalBest) {
          setSaveMessage(`Nuevo récord personal: ${Number(data.bestScore || finalScore)} pts`);
        } else {
          setSaveMessage(`Score guardado: ${finalScore} pts`);
        }
        setCurrentUserBest(Number.isFinite(Number(data?.bestScore)) ? Number(data.bestScore) : finalScore);
        await loadLeaderboard();
      } finally {
        setIsSavingScore(false);
      }
    },
    [loadLeaderboard]
  );

  const changeDirection = useCallback((nextDirection: Direction) => {
    setPendingDirection((prev) => {
      if (isOpposite(prev, nextDirection)) return prev;
      return nextDirection;
    });
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        changeDirection('up');
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        changeDirection('down');
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        changeDirection('left');
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        changeDirection('right');
      } else if (key === ' ' || key === 'enter') {
        event.preventDefault();
        if (!running || gameOver) resetGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDirection, gameOver, resetGame, running]);

  useEffect(() => {
    if (!running || gameOver) return;

    const timer = window.setInterval(() => {
      setDirection((prevDirection) => {
        const nextDirection = isOpposite(prevDirection, pendingDirection) ? prevDirection : pendingDirection;

        setSnake((prevSnake) => {
          const currentHead = prevSnake[0];
          const nextHead = movePoint(currentHead, nextDirection);

          const hitWall =
            nextHead.x < 0 ||
            nextHead.y < 0 ||
            nextHead.x >= BOARD_SIZE ||
            nextHead.y >= BOARD_SIZE;

          const hitSelf = prevSnake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

          if (hitWall || hitSelf) {
            setRunning(false);
            setGameOver(true);
            return prevSnake;
          }

          const nextSnake = [nextHead, ...prevSnake];
          const ateApple = nextHead.x === apple.x && nextHead.y === apple.y;
          if (ateApple) {
            setScore((prev) => prev + 1);
            setApple(randomApple(nextSnake));
            return nextSnake;
          }

          nextSnake.pop();
          return nextSnake;
        });

        return nextDirection;
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [apple, gameOver, pendingDirection, running]);

  useEffect(() => {
    if (!gameOver) return;
    void submitScore(score);
  }, [gameOver, score, submitScore]);

  const cellPercent = 100 / BOARD_SIZE;

  const snakeSegments = useMemo(
    () =>
      snake.map((segment, index) => {
        const isHead = index === 0;
        return (
          <div
            key={`segment-${segment.x}-${segment.y}-${index}`}
            className={`absolute rounded-[3px] ${isHead ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{
              width: `${cellPercent}%`,
              height: `${cellPercent}%`,
              left: `${segment.x * cellPercent}%`,
              top: `${segment.y * cellPercent}%`,
            }}
          />
        );
      }),
    [cellPercent, snake]
  );

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Error 404</p>
              <h1 className="title-display text-3xl sm:text-4xl mt-2">Página no encontrada · Snake Mode</h1>
              <p className="text-textMuted mt-2">
                Ya que hubo fallo, te dejo un mini juego: serpiente azul, cabeza verde, manzanas rojas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="button-primary">
                Volver al inicio
              </Link>
              <Link href="/tienda" className="button-secondary">
                Ir a tienda
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="rounded-xl border border-line p-3 sm:p-4 bg-[rgba(10,18,30,0.62)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm text-textMuted">
                  Score actual: <span className="text-primary font-semibold">{score}</span>
                </p>
                <p className="text-sm text-textMuted">
                  Tu récord: <span className="text-primary font-semibold">{currentUserBest ?? 0}</span>
                </p>
              </div>

              <div
                className="relative w-full max-w-[560px] mx-auto aspect-square border border-line rounded-xl overflow-hidden bg-[#0a1626]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(58,77,108,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(58,77,108,0.22) 1px, transparent 1px)',
                  backgroundSize: `${cellPercent}% ${cellPercent}%`,
                }}
              >
                <div
                  className="absolute bg-red-500 rounded-[4px]"
                  style={{
                    width: `${cellPercent}%`,
                    height: `${cellPercent}%`,
                    left: `${apple.x * cellPercent}%`,
                    top: `${apple.y * cellPercent}%`,
                  }}
                />
                {snakeSegments}

                {!running && !gameOver ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(6,12,20,0.52)]">
                    <button className="button-primary" onClick={resetGame}>
                      Empezar partida
                    </button>
                  </div>
                ) : null}

                {gameOver ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(6,12,20,0.72)] text-center p-4">
                    <p className="text-xl font-semibold">Game Over</p>
                    <p className="text-textMuted">Puntuación final: {score}</p>
                    <button className="button-primary" onClick={resetGame}>
                      Jugar de nuevo
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-[220px] mt-4 mx-auto">
                <span />
                <button className="button-secondary px-3 py-2 text-xs" onClick={() => changeDirection('up')}>
                  ↑
                </button>
                <span />
                <button className="button-secondary px-3 py-2 text-xs" onClick={() => changeDirection('left')}>
                  ←
                </button>
                <button
                  className="button-secondary px-3 py-2 text-xs"
                  onClick={() => {
                    if (gameOver) {
                      resetGame();
                      return;
                    }
                    if (!running) {
                      setRunning(true);
                      return;
                    }
                    setRunning(false);
                  }}
                >
                  {gameOver ? 'Start' : running ? 'Pausa' : 'Reanudar'}
                </button>
                <button className="button-secondary px-3 py-2 text-xs" onClick={() => changeDirection('right')}>
                  →
                </button>
                <span />
                <button className="button-secondary px-3 py-2 text-xs" onClick={() => changeDirection('down')}>
                  ↓
                </button>
                <span />
              </div>

              <p className="text-xs text-textMuted mt-3 text-center">
                Controles: flechas o WASD. Guarda score con sesión iniciada.
              </p>
              {saveMessage ? <p className="text-xs text-primary mt-2 text-center">{saveMessage}</p> : null}
            </div>

            <aside className="rounded-xl border border-line p-4 bg-[rgba(10,18,30,0.64)]">
              <h2 className="font-semibold text-lg">Top Score 404</h2>
              <p className="text-xs text-textMuted mt-1">
                Ranking global de usuarios. {isAuthenticated ? 'Sesión activa' : 'Inicia sesión para guardar score'}.
              </p>

              <div className="mt-3 space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-textMuted">Todavía no hay puntuaciones guardadas.</p>
                ) : (
                  leaderboard.map((item, index) => (
                    <div
                      key={`${item.display_name}-${item.best_score}-${item.updated_at}-${index}`}
                      className="rounded-lg border border-line px-3 py-2 bg-[rgba(8,14,24,0.66)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          #{index + 1} {item.display_name}
                        </p>
                        <p className="text-primary font-semibold text-sm">{item.best_score}</p>
                      </div>
                      <p className="text-xs text-textMuted mt-1">
                        Partidas: {item.games_played} · Act: {formatUpdatedAt(item.updated_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <button
                className="button-secondary w-full mt-4"
                onClick={() => void loadLeaderboard()}
                disabled={isSavingScore}
              >
                Actualizar ranking
              </button>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
