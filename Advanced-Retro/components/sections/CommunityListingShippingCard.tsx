'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  calculateCommunityShippingQuoteFromArenys,
  inferShippingZoneFromAddress,
  type CommunityShippingZone,
} from '@/lib/shipping';

type Props = {
  itemPriceCents: number;
  packageSize?: string | null;
  sellerLocationLabel?: string | null;
};

type ZoneOption = {
  value: CommunityShippingZone;
  label: string;
};

const ZONE_OPTIONS: ZoneOption[] = [
  { value: 'local_arenys_barcelona', label: 'Arenys / Barcelona' },
  { value: 'cataluna', label: 'Cataluña' },
  { value: 'espana_peninsula', label: 'España peninsular' },
  { value: 'espana_baleares', label: 'Baleares' },
  { value: 'espana_canarias', label: 'Canarias' },
  { value: 'espana_ceuta_melilla', label: 'Ceuta / Melilla' },
  { value: 'eu', label: 'Unión Europea' },
  { value: 'europe_non_eu', label: 'Europa no UE' },
  { value: 'rest_world', label: 'Resto del mundo' },
];

function toEuro(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

export default function CommunityListingShippingCard({ itemPriceCents, packageSize, sellerLocationLabel }: Props) {
  const [zone, setZone] = useState<CommunityShippingZone>('espana_peninsula');
  const [zoneAutodetected, setZoneAutodetected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadViewerAddress = async () => {
      try {
        const res = await fetch('/api/auth/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const shippingAddress = data?.user?.profile?.shipping_address;
        if (!shippingAddress || cancelled) return;
        const detected = inferShippingZoneFromAddress(shippingAddress);
        if (!cancelled) {
          setZone(detected);
          setZoneAutodetected(true);
        }
      } catch {
        // Mantener zona por defecto.
      }
    };
    void loadViewerAddress();
    return () => {
      cancelled = true;
    };
  }, []);

  const quote = useMemo(
    () =>
      calculateCommunityShippingQuoteFromArenys({
        zone,
        itemPriceCents,
        packageSize,
      }),
    [zone, itemPriceCents, packageSize]
  );

  const totalCents = Math.max(0, Number(itemPriceCents || 0)) + quote.costCents;

  return (
    <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.55)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Precio final con envío</p>
        {sellerLocationLabel ? (
          <span className="chip text-[11px]">Vendedor en {sellerLocationLabel}</span>
        ) : null}
      </div>

      <p className="text-3xl font-semibold text-primary">{toEuro(totalCents)}</p>
      <p className="text-xs text-textMuted">
        Producto {toEuro(itemPriceCents)} + envío {toEuro(quote.costCents)}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-textMuted">
          Zona de entrega
          <select
            value={zone}
            onChange={(event) => setZone(event.target.value as CommunityShippingZone)}
            className="mt-1 w-full rounded-lg border border-line bg-[rgba(6,12,22,0.62)] px-2 py-2 text-sm text-white"
          >
            {ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-textMuted rounded-lg border border-line bg-[rgba(6,12,22,0.62)] px-3 py-2">
          <p>Paquete: {quote.packageSize}</p>
          <p>Entrega estimada: {quote.etaLabel}</p>
          {zoneAutodetected ? <p>Zona detectada desde tu perfil.</p> : <p>Zona por defecto: España peninsular.</p>}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs text-textMuted">
        <p className="rounded-lg border border-line bg-[rgba(6,12,22,0.62)] px-3 py-2">
          Base zona: {toEuro(quote.baseCents)} · factor tamaño x{quote.sizeMultiplier.toFixed(2)}
        </p>
        <p className="rounded-lg border border-line bg-[rgba(6,12,22,0.62)] px-3 py-2">
          Manipulación {toEuro(quote.handlingCents)} · combustible {toEuro(quote.fuelCents)} · protección{' '}
          {toEuro(quote.protectionCents)}
        </p>
      </div>
    </div>
  );
}

