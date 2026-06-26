'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import TrackerBootstrap from '@/components/TrackerBootstrap';
import styles from './retroville-shell.module.css';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
    retrovilleSignal?: () => void;
  }
}

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

function getErrorFingerprint(message: string, pathname: string, source: string) {
  return `${source}:${pathname}:${message}`.slice(0, 320);
}

export default function RetrovilleShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/retroville';
  const plausibleDomain = (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '').trim();
  const plausibleScriptUrl =
    (process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL || '').trim() || 'https://plausible.io/js/script.js';
  const gaMeasurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
  const lastPathRef = useRef(pathname);
  const analyticsPathRef = useRef(pathname);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const reportedErrorsRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [routePulse, setRoutePulse] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(false);
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const [easterEggSource, setEasterEggSource] = useState<'konami' | 'console'>('konami');

  useEffect(() => {
    const syncProgress = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      setScrollProgress(maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0);
    };

    syncProgress();
    window.addEventListener('scroll', syncProgress, { passive: true });
    window.addEventListener('resize', syncProgress);
    return () => {
      window.removeEventListener('scroll', syncProgress);
      window.removeEventListener('resize', syncProgress);
    };
  }, [pathname]);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    setRoutePulse(true);
    const timer = window.setTimeout(() => setRoutePulse(false), 260);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (analyticsPathRef.current === pathname) return;
    analyticsPathRef.current = pathname;

    window.gtag?.('event', 'page_view', {
      page_title: document.title,
      page_path: pathname,
      page_location: window.location.href,
      content_group1: 'retroville',
    });

    window.plausible?.('pageview', {
      props: {
        path: pathname,
        zone: 'retroville',
      },
    });
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (hover: hover)');
    const sync = () => setCursorEnabled(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!cursorEnabled) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = window.requestAnimationFrame(() => {
        const x = event.clientX;
        const y = event.clientY;
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${x - 7}px, ${y - 7}px, 0)`;
        }
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
        }
      });
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'translate3d(-100px, -100px, 0)';
      if (glowRef.current) glowRef.current.style.transform = 'translate3d(-100px, -100px, 0)';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorEnabled]);

  useEffect(() => {
    const unlock = (source: 'konami' | 'console') => {
      setEasterEggSource(source);
      setEasterEggVisible(true);
      window.setTimeout(() => setEasterEggVisible(false), 4200);
    };

    let pointer = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === KONAMI[pointer]) {
        pointer += 1;
        if (pointer === KONAMI.length) {
          pointer = 0;
          unlock('konami');
        }
        return;
      }
      pointer = key === KONAMI[0] ? 1 : 0;
    };

    window.retrovilleSignal = () => unlock('console');
    window.addEventListener('keydown', onKeyDown);
    // Intentional discoverable command for the community.
    console.info('Retroville debug command available: window.retrovilleSignal()');

    return () => {
      delete window.retrovilleSignal;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    const report = (payload: {
      message: string;
      stack?: string | null;
      severity?: 'error' | 'critical';
      extra_data?: Record<string, unknown>;
    }) => {
      const fingerprint = getErrorFingerprint(payload.message, pathname, String(payload.extra_data?.source || 'retroville'));
      if (reportedErrorsRef.current.has(fingerprint)) return;
      reportedErrorsRef.current.add(fingerprint);
      void fetch('/api/admin/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          message: payload.message,
          stack: payload.stack || null,
          url: window.location.href,
          severity: payload.severity || 'error',
          extra_data: {
            route: pathname,
            zone: 'retroville',
            ...payload.extra_data,
          },
        }),
      }).catch(() => null);
    };

    const onError = (event: ErrorEvent) => {
      report({
        message: event.message || 'Retroville client error',
        stack: event.error instanceof Error ? event.error.stack || null : null,
        extra_data: { source: 'window.error' },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === 'string'
            ? event.reason
            : 'Unhandled promise rejection';
      report({
        message: reason,
        stack: event.reason instanceof Error ? event.reason.stack || null : null,
        extra_data: { source: 'window.unhandledrejection' },
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [pathname]);

  return (
    <div className={`${styles.shell} retroville-shell-initial`} data-cursor={cursorEnabled ? 'on' : 'off'}>
      <Suspense fallback={null}>
        <TrackerBootstrap />
      </Suspense>

      {plausibleDomain ? (
        <Script
          src={plausibleScriptUrl}
          strategy="afterInteractive"
          data-domain={plausibleDomain}
        />
      ) : null}

      {gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="retroville-ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>

      <div className={`${styles.content} ${routePulse ? styles.contentTransition : ''}`}>{children}</div>

      {cursorEnabled ? (
        <>
          <div ref={glowRef} className={styles.cursorGlow} aria-hidden="true" />
          <div ref={cursorRef} className={styles.cursorChip} aria-hidden="true" />
        </>
      ) : null}

      {easterEggVisible ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <p className={styles.toastEyebrow}>Signal unlocked</p>
          <p className={styles.toastTitle}>RETROVILLE // GLITCH DETECTED</p>
          <p className={styles.toastBody}>
            {easterEggSource === 'konami'
              ? 'Has encontrado la combinación oculta. La ciudad recuerda a quien insiste en mirar más allá del menú.'
              : 'Has llamado a la señal desde la consola. Eso suele ser una mala idea, pero queda bien.'}
          </p>
        </div>
      ) : null}

      <Analytics />
    </div>
  );
}
