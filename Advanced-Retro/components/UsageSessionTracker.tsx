'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

const HEARTBEAT_INTERVAL_MS = 30_000;
const MIN_DELTA_SECONDS = 1;
const MAX_DELTA_SECONDS = 900;
const SESSION_STORAGE_KEY = 'advancedretro:usage-session-id';
const SESSION_STORAGE_USER_KEY = 'advancedretro:usage-session-user';

function clampDeltaSeconds(value: number): number {
  const safe = Math.floor(Number(value || 0));
  if (!Number.isFinite(safe)) return 0;
  if (safe < MIN_DELTA_SECONDS) return 0;
  return Math.min(MAX_DELTA_SECONDS, safe);
}

function normalizePath(pathname: string | null): string {
  if (!pathname || typeof pathname !== 'string') return '/';
  const clean = pathname.trim();
  if (!clean) return '/';
  if (!clean.startsWith('/')) return '/';
  return clean.slice(0, 320);
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readSessionIdForUser(userId: string): string {
  if (typeof window === 'undefined') return createSessionId();
  const safeUser = String(userId || '').trim();
  const currentUser = window.sessionStorage.getItem(SESSION_STORAGE_USER_KEY) || '';
  const currentSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY) || '';

  if (safeUser && safeUser === currentUser && currentSession) {
    return currentSession;
  }

  const next = createSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_USER_KEY, safeUser);
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

export default function UsageSessionTracker() {
  const pathname = usePathname();
  const userIdRef = useRef('');
  const sessionIdRef = useRef('');
  const lastSentAtRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>(normalizePath(pathname));
  const sendingRef = useRef(false);

  const sendHeartbeat = useCallback(
    async (options?: { keepalive?: boolean; markEnded?: boolean; forceActiveSeconds?: number; allowZero?: boolean }) => {
      if (!supabaseClient) return;
      const userId = String(userIdRef.current || '').trim();
      if (!userId) return;

      const sessionId = String(sessionIdRef.current || '').trim() || readSessionIdForUser(userId);
      sessionIdRef.current = sessionId;

      const now = Date.now();
      const computedDelta = clampDeltaSeconds((now - lastSentAtRef.current) / 1000);
      const activeSeconds = clampDeltaSeconds(
        typeof options?.forceActiveSeconds === 'number' ? options.forceActiveSeconds : computedDelta
      );

      if (activeSeconds === 0 && !options?.markEnded && !options?.allowZero) {
        return;
      }

      if (sendingRef.current && !options?.markEnded) {
        return;
      }

      sendingRef.current = true;
      try {
        await fetch('/api/profile/usage/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          keepalive: Boolean(options?.keepalive),
          body: JSON.stringify({
            sessionId,
            path: currentPathRef.current,
            activeSeconds,
            markEnded: Boolean(options?.markEnded),
          }),
        });
      } catch {
        // tracking best-effort
      } finally {
        lastSentAtRef.current = now;
        sendingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    currentPathRef.current = normalizePath(pathname);
    if (userIdRef.current) {
      void sendHeartbeat({ forceActiveSeconds: 0, allowZero: true });
    }
  }, [pathname, sendHeartbeat]);

  useEffect(() => {
    const client = supabaseClient;
    if (!client) return;
    let mounted = true;

    const syncSession = async () => {
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      const userId = String(data?.session?.user?.id || '').trim();
      userIdRef.current = userId;
      if (!userId) return;
      sessionIdRef.current = readSessionIdForUser(userId);
      lastSentAtRef.current = Date.now();
      void sendHeartbeat({ forceActiveSeconds: 0, allowZero: true });
    };

    void syncSession();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const userId = String(session?.user?.id || '').trim();
      userIdRef.current = userId;
      if (!userId) return;
      sessionIdRef.current = readSessionIdForUser(userId);
      lastSentAtRef.current = Date.now();
      void sendHeartbeat({ forceActiveSeconds: 0, allowZero: true });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [sendHeartbeat]);

  useEffect(() => {
    if (!supabaseClient) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void sendHeartbeat({ keepalive: true });
      } else {
        lastSentAtRef.current = Date.now();
      }
    };

    const onPageHide = () => {
      void sendHeartbeat({ keepalive: true, markEnded: true, forceActiveSeconds: 0 });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [sendHeartbeat]);

  return null;
}
