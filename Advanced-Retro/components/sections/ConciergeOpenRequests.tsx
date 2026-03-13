'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';

type OpenConciergeTicket = {
  id: string;
  subject: string;
  status: string;
  concierge_state?: string | null;
  helper_user_id?: string | null;
  created_at: string;
  updated_at: string;
  last_message?: {
    message?: string | null;
    created_at?: string | null;
    is_admin?: boolean;
  } | null;
  requester?: {
    id: string;
    name?: string | null;
    avatar_url?: string | null;
    helper_completed_count?: number | null;
    helper_reputation?: number | null;
  } | null;
};

function toRelativeDate(value: string): string {
  const timestamp = new Date(String(value || '')).getTime();
  if (!Number.isFinite(timestamp)) return 'Hace poco';
  const diffHours = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours < 1) return 'Hace menos de 1h';
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
}

export default function ConciergeOpenRequests() {
  const router = useRouter();
  const [tickets, setTickets] = useState<OpenConciergeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<OpenConciergeTicket | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [goodFaithAccepted, setGoodFaithAccepted] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  const loadOpenRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/concierge/open?limit=40', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar los encargos abiertos');
      }
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (error: any) {
      setTickets([]);
      toast.error(error?.message || 'No se pudieron cargar encargos abiertos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOpenRequests();
  }, []);

  const claimRequest = async () => {
    if (!selectedTicket?.id) return;
    if (!termsAccepted || !goodFaithAccepted || !legalAccepted) {
      toast.error('Debes aceptar todas las condiciones para continuar');
      return;
    }

    if (!supabaseClient) {
      toast.error('Configura Supabase para usar esta función');
      return;
    }

    const { data: auth } = await supabaseClient.auth.getUser();
    if (!auth.user) {
      toast.error('Inicia sesión para ayudar en un encargo');
      router.push('/login?next=/servicio-compra');
      return;
    }

    const ticketId = String(selectedTicket.id || '');
    setClaimingId(ticketId);
    try {
      const res = await fetch(`/api/chat/concierge/${encodeURIComponent(ticketId)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo reclamar el encargo');
      }
      toast.success('Encargo reclamado. Ya puedes chatear con el comprador.');
      setSelectedTicket(null);
      setTermsAccepted(false);
      setGoodFaithAccepted(false);
      setLegalAccepted(false);
      await loadOpenRequests();
      router.push(`/perfil?tab=tickets&ticket=${encodeURIComponent(ticketId)}`);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo reclamar el encargo');
    } finally {
      setClaimingId('');
    }
  };

  return (
    <div className="glass p-5 sm:p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-lg">Encargos abiertos para ayudar</h3>
          <p className="text-sm text-textMuted mt-1">
            Si ayudas a resolver un encargo, sube tu reputación de helper en la comunidad.
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={() => void loadOpenRequests()} disabled={loading}>
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-textMuted">Cargando encargos abiertos...</p>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-line bg-[rgba(9,16,26,0.7)] p-4 text-sm text-textMuted">
            No hay encargos abiertos ahora mismo. Vuelve en unos minutos o abre tu propio encargo.
          </div>
        ) : (
          tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-xl border border-line bg-[rgba(9,16,26,0.7)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold line-clamp-1">{ticket.subject}</p>
                  <p className="text-xs text-textMuted mt-1">
                    Comprador: {String(ticket.requester?.name || 'Usuario')} · {toRelativeDate(ticket.updated_at)}
                  </p>
                  <p className="text-[11px] text-textMuted mt-1">
                    Historial comprador: {Number(ticket.requester?.helper_completed_count || 0)} ayudas cerradas
                  </p>
                </div>
                <span className="chip border-primary/40 text-primary">Abierto</span>
              </div>
              <p className="mt-2 text-sm text-textMuted line-clamp-2">
                {String(ticket.last_message?.message || 'Sin detalles adicionales todavía.')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  Quiero ayudar
                </button>
                <Link href={`/perfil?tab=tickets&ticket=${encodeURIComponent(ticket.id)}`} className="button-secondary">
                  Ver chat
                </Link>
              </div>
              <p className="mt-2 text-[11px] text-textMuted">
                Regla automática: si no respondes en 72h, el encargo se libera y ya no podrás retomar esta misma solicitud.
              </p>
            </article>
          ))
        )}
      </div>

      {selectedTicket ? (
        <div
          className="fixed inset-0 z-[90] bg-[rgba(3,8,14,0.78)] backdrop-blur-sm p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-line bg-[rgba(8,14,24,0.98)] p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Condiciones de ayuda</p>
            <h4 className="title-display mt-2 text-2xl">Antes de entrar al ticket</h4>
            <p className="text-sm text-textMuted mt-2">
              Debes actuar de buena fe y seguir estas normas para proteger al comprador y a la tienda.
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 text-sm text-textMuted">
              <li>Prohibido intentar colar réplicas, falsificaciones o artículos manipulados.</li>
              <li>Prohibidos insultos, acoso o cualquier conducta de mala fe en el chat.</li>
              <li>El incumplimiento puede implicar bloqueo permanente y medidas legales.</li>
              <li>Si no respondes en plazo, el encargo se reabrirá para otros helpers.</li>
            </ul>

            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>Acepto no ofrecer productos réplica/falsos y respetar la autenticidad.</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={goodFaithAccepted}
                  onChange={(e) => setGoodFaithAccepted(e.target.checked)}
                />
                <span>Acepto actuar de buena fe y mantener comunicación profesional.</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                />
                <span>Acepto las condiciones y posible veto automático por incumplimiento.</span>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="button-primary"
                disabled={Boolean(claimingId)}
                onClick={claimRequest}
              >
                {claimingId === selectedTicket.id ? 'Entrando...' : 'Aceptar y tomar encargo'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setSelectedTicket(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
