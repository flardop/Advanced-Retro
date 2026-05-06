'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminApiResponse } from '@/types/admin';

export function useAdminFetch<T>(url: string, options?: { immediate?: boolean }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(options?.immediate ?? true));
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as AdminApiResponse<T> | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo cargar la información');
      }
      setData(payload.data ?? null);
      return payload.data ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options?.immediate === false) return;
    void execute();
  }, [execute, options?.immediate]);

  return { data, loading, error, refetch: execute, setData };
}
