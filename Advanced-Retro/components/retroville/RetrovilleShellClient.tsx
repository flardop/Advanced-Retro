'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname, useRouter } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import TrackerBootstrap from '@/components/TrackerBootstrap';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  createDefaultConsent,
  normalizeConsent,
  type CookieConsentState,
} from '@/lib/cookieConsent';
import { getTrackerClientContext } from '@/lib/admin/tracker';
import styles from './retroville-shell.module.css';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
    retrovilleTrack?: (eventName: string, props?: Record<string, unknown>) => void;
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

function readConsent(): CookieConsentState {
  if (typeof window === 'undefined') return createDefaultConsent();
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return createDefaultConsent();
  try {
    return normalizeConsent(JSON.parse(raw));
  } catch {
    return createDefaultConsent();
  }
}

function buildInternalRetrovilleHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

export default function RetrovilleShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/retroville';
  const router = useRouter();
  const plausibleDomain = (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '').trim();
  const plausibleScriptUrl =
    (process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL || '').trim() || 'https://plausible.io/js/script.js';
  const gaMeasurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
  const lastPathRef = useRef(pathname);
  const analyticsPathRef = useRef(pathname);
  const reportedErrorsRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef({ x: -100, y: -100 });
  const currentPointerRef = useRef({ x: -100, y: -100 });
  const animationFrameRef = useRef<number | null>(null);
  const navigationTimerRef = useRef<number | null>(null);
  const clearTransitionTimerRef = useRef<number | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cursorEnabled, setCursorEnabled] = useState(false);
  const [routeTransition, setRouteTransition] = useState<'idle' | 'cover' | 'reveal'>('reveal');
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

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
    const initial = readConsent();
    setAnalyticsEnabled(Boolean(initial.analytics));

    const onChanged = (event: Event) => {
      const custom = event as CustomEvent<CookieConsentState>;
      if (custom.detail) {
        setAnalyticsEnabled(Boolean(custom.detail.analytics));
        return;
      }
      setAnalyticsEnabled(Boolean(readConsent().analytics));
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    window.retrovilleTrack = (eventName, props = {}) => {
      const trackingContext = getTrackerClientContext();

      void fetch('/api/retroville/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          event_name: eventName,
          path: trackingContext.path,
          page_title: trackingContext.pageTitle,
          session_id: trackingContext.sessionId,
          referrer: trackingContext.referrer,
          device_type: trackingContext.deviceType,
          browser: trackingContext.browser,
          os: trackingContext.os,
          meta: props,
        }),
      }).catch(() => null);

      if (!analyticsEnabled) return;

      window.gtag?.('event', eventName, {
        event_category: 'retroville',
        page_path: trackingContext.path,
        ...props,
      });
      window.plausible?.(eventName, {
        props: {
          zone: 'retroville',
          page: trackingContext.path,
          ...props,
        },
      });
    };

    return () => {
      delete window.retrovilleTrack;
    };
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled) return;
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
  }, [analyticsEnabled, pathname]);

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
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      pointerRef.current = { x: -100, y: -100 };
    };

    const render = () => {
      currentPointerRef.current = {
        x: currentPointerRef.current.x + (pointerRef.current.x - currentPointerRef.current.x) * 0.1,
        y: currentPointerRef.current.y + (pointerRef.current.y - currentPointerRef.current.y) * 0.1,
      };

      const { x, y } = currentPointerRef.current;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
      }

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    animationFrameRef.current = window.requestAnimationFrame(render);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorEnabled]);

  useEffect(() => {
    const clearTransitionLater = () => {
      if (clearTransitionTimerRef.current) window.clearTimeout(clearTransitionTimerRef.current);
      clearTransitionTimerRef.current = window.setTimeout(() => setRouteTransition('idle'), 200);
    };

    if (lastPathRef.current === pathname) {
      clearTransitionLater();
      return () => {
        if (clearTransitionTimerRef.current) window.clearTimeout(clearTransitionTimerRef.current);
      };
    }

    lastPathRef.current = pathname;
    setRouteTransition('reveal');
    clearTransitionLater();
    return () => {
      if (clearTransitionTimerRef.current) window.clearTimeout(clearTransitionTimerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);

      if (destination.origin !== current.origin) return;
      if (!destination.pathname.startsWith('/retroville')) return;

      const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
      if (sameDocument) return;

      event.preventDefault();
      if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
      setRouteTransition('cover');
      navigationTimerRef.current = window.setTimeout(() => {
        router.push(buildInternalRetrovilleHref(destination));
      }, 180);
    };

    document.addEventListener('click', onClickCapture, true);
    return () => {
      document.removeEventListener('click', onClickCapture, true);
      if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
    };
  }, [router]);

  useEffect(() => {
    let pointer = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === KONAMI[pointer]) {
        pointer += 1;
        if (pointer === KONAMI.length) {
          pointer = 0;
          setEasterEggVisible(true);
          window.setTimeout(() => setEasterEggVisible(false), 4200);
        }
        return;
      }
      pointer = key === KONAMI[0] ? 1 : 0;
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
    <div className={styles.shell} data-cursor={cursorEnabled ? 'on' : 'off'}>
      <Suspense fallback={null}>
        <TrackerBootstrap />
      </Suspense>

      {analyticsEnabled && plausibleDomain ? (
        <Script
          src={plausibleScriptUrl}
          strategy="afterInteractive"
          data-domain={plausibleDomain}
        />
      ) : null}

      {analyticsEnabled && gaMeasurementId ? (
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

      <div className={styles.content}>{children}</div>
      <div
        className={`${styles.routeVeil} ${
          routeTransition === 'cover'
            ? styles.routeVeilCover
            : routeTransition === 'reveal'
              ? styles.routeVeilReveal
              : ''
        }`}
        aria-hidden="true"
      />

      {cursorEnabled ? (
        <>
          <div ref={glowRef} className={styles.cursorGlow} aria-hidden="true" />
          <div ref={cursorRef} className={styles.cursorDot} aria-hidden="true" />
        </>
      ) : null}

      {easterEggVisible ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <p className={styles.toastEyebrow}>Signal unlocked</p>
          <p className={styles.toastTitle}>RETROVILLE // GLITCH DETECTED</p>
          <p className={styles.toastBody}>
            Has encontrado la combinación oculta. La ciudad recuerda a quien insiste en mirar más allá del menú.
          </p>
        </div>
      ) : null}

      {analyticsEnabled ? <Analytics /> : null}
    </div>
  );
}
