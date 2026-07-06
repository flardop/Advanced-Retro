'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';

export default function RetrovilleAdminSeoActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegenerate = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/retroville/admin/seo/regenerate-sitemap', {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { includedUrls: number };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'No se pudo regenerar el sitemap');
      }

      setMessage(`Sitemap regenerado con ${payload.data.includedUrls} URLs incluidas.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo regenerar el sitemap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <RefreshCcw className="h-4 w-4" />
        {loading ? 'Regenerando…' : 'Regenerar sitemap'}
      </button>
      {message ? <p className="text-sm text-[var(--admin-text-muted)]">{message}</p> : null}
    </div>
  );
}
