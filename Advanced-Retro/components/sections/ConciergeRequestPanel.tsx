'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';

export default function ConciergeRequestPanel() {
  const router = useRouter();
  const [gameTitle, setGameTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const createConciergeTicket = async () => {
    if (!gameTitle.trim() || gameTitle.trim().length < 3) {
      toast.error('Indica qué producto quieres encontrar');
      return;
    }
    if (details.trim().length < 8) {
      toast.error('Añade más detalle para abrir el encargo');
      return;
    }
    if (!supabaseClient) {
      toast.error('Configura Supabase para usar este servicio');
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (!data.user) {
        toast.error('Inicia sesión para abrir el chat de encargo');
        router.push('/login?next=/servicio-compra');
        return;
      }

      const subject = `Encargo verificado · ${gameTitle.trim().slice(0, 90)}`;
      const message = [
        `Producto objetivo: ${gameTitle.trim()}`,
        budget.trim() ? `Presupuesto aproximado: ${budget.trim()} €` : null,
        `Detalles del encargo: ${details.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/chat/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || 'No se pudo abrir el chat de encargo');
      }

      const ticketId = String(payload?.ticket?.id || '').trim();
      toast.success('Encargo creado. Chat verificado abierto.');
      if (ticketId) {
        router.push(`/perfil?tab=tickets&ticket=${ticketId}`);
      } else {
        router.push('/perfil?tab=tickets');
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo abrir el chat de encargo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-line p-5 bg-surface mt-6">
      <h3 className="font-semibold text-lg">Abrir encargo y chat verificado</h3>
      <p className="text-sm text-textMuted mt-2">
        Este formulario crea automáticamente un ticket privado entre comprador y tienda.
      </p>
      <div className="grid gap-3 mt-4">
        <input
          className="bg-transparent border border-line px-3 py-2"
          placeholder="Producto que buscas (ej: Pokémon Esmeralda CIB)"
          value={gameTitle}
          onChange={(e) => setGameTitle(e.target.value)}
        />
        <input
          className="bg-transparent border border-line px-3 py-2"
          placeholder="Presupuesto aproximado (€)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <textarea
          className="bg-transparent border border-line px-3 py-2 min-h-[110px]"
          placeholder="Estado deseado, idioma, si aceptas repro 1:1, plazo, etc."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <button className="button-primary" onClick={createConciergeTicket} disabled={loading}>
          {loading ? 'Abriendo chat...' : 'Crear encargo y abrir chat'}
        </button>
      </div>
    </div>
  );
}
