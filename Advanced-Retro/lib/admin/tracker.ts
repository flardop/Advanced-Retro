'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { TRACKING_HEARTBEAT_MS } from '@/lib/admin/constants';

const STORAGE_KEY = 'advancedretro:admin-tracker-session';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(STORAGE_KEY, next);
  return next;
}

function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  return 'Unknown';
}

function detectOs(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('linux')) return 'Linux';
  return 'Unknown';
}

function isTrackedPath(pathname: string) {
  return !pathname.startsWith('/admin') && pathname !== '/retroville' && pathname !== '/creador-de-tiendas';
}

export function useAdvancedAdminTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>('');
  const lastSeenAtRef = useRef<number>(Date.now());
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    if (!pathname || !isTrackedPath(pathname)) return;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const fullPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    let disposed = false;

    const startView = async () => {
      viewIdRef.current = null;
      try {
        const response = await fetch('/api/admin/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({
            mode: 'start',
            url: fullPath,
            pageTitle: document.title,
            referrer: document.referrer || null,
            sessionId,
            deviceType: detectDeviceType(userAgent),
            browser: detectBrowser(userAgent),
            os: detectOs(userAgent),
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!disposed && payload?.success && payload?.data?.viewId) {
          viewIdRef.current = String(payload.data.viewId);
        }
      } catch {
        viewIdRef.current = null;
      }

      if (!disposed) {
        lastPathRef.current = fullPath;
        lastSeenAtRef.current = Date.now();
      }
    };

    const finishView = async (keepalive = false) => {
      if (!viewIdRef.current || !lastPathRef.current) return;
      const viewId = viewIdRef.current;
      const now = Date.now();
      const duration = Math.max(1, Math.round((now - lastSeenAtRef.current) / 1000));
      lastSeenAtRef.current = now;
      await fetch('/api/admin/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive,
        body: JSON.stringify({
          mode: 'complete',
          viewId,
          url: lastPathRef.current,
          durationSeconds: duration,
          sessionId,
        }),
      }).catch(() => null);
      if (!disposed && viewIdRef.current === viewId) {
        viewIdRef.current = null;
      }
    };

    if (lastPathRef.current && lastPathRef.current !== fullPath) {
      void finishView();
    }

    void startView();

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void fetch('/api/admin/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({
          sessionId,
          currentPage: fullPath,
          pageTitle: document.title,
          deviceType: detectDeviceType(userAgent),
          browser: detectBrowser(userAgent),
          os: detectOs(userAgent),
        }),
      }).catch(() => null);
    }, TRACKING_HEARTBEAT_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void finishView(true);
      }
    };

    const handlePageHide = () => {
      void finishView(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      disposed = true;
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [pathname, searchParams, sessionId]);
}
