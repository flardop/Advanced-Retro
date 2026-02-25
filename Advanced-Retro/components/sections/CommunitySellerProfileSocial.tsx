'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type SellerSocialSummary = {
  visits: number;
  likes: number;
  likedByCurrentVisitor: boolean;
  updatedAt?: string;
};

const EMPTY_SUMMARY: SellerSocialSummary = {
  visits: 0,
  likes: 0,
  likedByCurrentVisitor: false,
};

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'advanced-retro-visitor-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function CommunitySellerProfileSocial({ sellerId }: { sellerId: string }) {
  const [visitorId, setVisitorId] = useState('');
  const [summary, setSummary] = useState<SellerSocialSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    if (!sellerId || !visitorId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/community/sellers/${encodeURIComponent(sellerId)}/social?visitorId=${encodeURIComponent(visitorId)}`,
          { cache: 'no-store' }
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.summary) setSummary(data.summary);
      } catch {
        if (!cancelled) setSummary(EMPTY_SUMMARY);
      }
    };

    const trackVisit = async () => {
      try {
        const res = await fetch(`/api/community/sellers/${encodeURIComponent(sellerId)}/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'visit', visitorId }),
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.summary) setSummary(data.summary);
      } catch {
        // no-op
      }
    };

    void load();
    void trackVisit();

    return () => {
      cancelled = true;
    };
  }, [sellerId, visitorId]);

  const toggleLike = async () => {
    if (!sellerId || !visitorId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/sellers/${encodeURIComponent(sellerId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like', visitorId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar me gusta');
      if (data?.summary) setSummary(data.summary);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar me gusta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.52)]">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">Interacción pública</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-line p-3">
          <p className="text-xs text-textMuted">Visitas perfil</p>
          <p className="text-xl font-semibold text-primary mt-1">{summary.visits}</p>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-xs text-textMuted">Me gusta</p>
          <p className="text-xl font-semibold text-primary mt-1">{summary.likes}</p>
        </div>
        <div className="rounded-xl border border-line p-3 flex items-center">
          <button
            type="button"
            className={`chip w-full justify-center ${
              summary.likedByCurrentVisitor ? 'border-primary text-primary bg-primary/10' : ''
            }`}
            onClick={toggleLike}
            disabled={loading}
          >
            {loading
              ? 'Guardando...'
              : summary.likedByCurrentVisitor
                ? 'Quitar me gusta'
                : 'Me gusta este perfil'}
          </button>
        </div>
      </div>
      <p className="text-xs text-textMuted mt-3">
        Los me gusta del perfil ayudan a destacar vendedores activos dentro de la comunidad.
      </p>
    </div>
  );
}

