import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { listMysteryBoxes } from '@/lib/mysteryBox';
import { getMysterySetupErrorMessage, isMysterySetupMissing } from '@/lib/mysterySetup';

export type PublicMysteryPrize = {
  id: string;
  label: string;
  prize_type: 'physical_product' | 'discount_coupon' | 'other';
  stock: number | null;
  metadata: Record<string, unknown>;
};

export type PublicMysteryBox = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ticket_price: number;
  image?: string;
  available_tickets: number;
  prizes: PublicMysteryPrize[];
};

export function serializePublicMysteryBoxes(boxes: any[]): PublicMysteryBox[] {
  return (boxes || []).map((box: any) => ({
    ...box,
    image: box?.image || box?.image_url || '/images/mystery/mystery-standard.webp',
    prizes: (box?.prizes || []).map((prize: any) => ({
      id: String(prize.id || ''),
      label: String(prize.label || ''),
      prize_type: prize.prize_type,
      stock: prize.stock ?? null,
      metadata: prize.metadata && typeof prize.metadata === 'object' ? prize.metadata : {},
    })),
  }));
}

export async function getPublicMysteryBoxesForPage() {
  try {
    if (!supabaseAdmin) {
      return {
        boxes: [] as PublicMysteryBox[],
        setupMessage: 'Supabase no está configurado todavía para Mystery Boxes.',
      };
    }

    const boxes = await listMysteryBoxes({
      supabaseAdmin,
      userId: null,
    });

    return {
      boxes: serializePublicMysteryBoxes(boxes),
      setupMessage: '',
    };
  } catch (error: any) {
    if (isMysterySetupMissing(error)) {
      return {
        boxes: [] as PublicMysteryBox[],
        setupMessage: getMysterySetupErrorMessage(),
      };
    }

    return {
      boxes: [] as PublicMysteryBox[],
      setupMessage: error?.message || 'No se pudieron cargar las Mystery Boxes.',
    };
  }
}
