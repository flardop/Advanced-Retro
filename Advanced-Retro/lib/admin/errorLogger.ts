'use client';

import type { ErrorSeverity } from '@/types/admin';

export async function logError(
  message: string,
  stack: string | null,
  url: string,
  severity: ErrorSeverity = 'error',
  extra?: Record<string, unknown>
) {
  try {
    await fetch('/api/admin/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({
        message,
        stack,
        url,
        severity,
        extra_data: extra || null,
      }),
    });
  } catch {
    // best-effort only
  }
}
