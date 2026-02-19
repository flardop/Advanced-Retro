export function isMysterySetupMissing(error: any): boolean {
  const code = String(error?.code || '').trim().toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'PGRST205') return true;

  return (
    message.includes('public.mystery_boxes') ||
    message.includes('public.mystery_box_prizes') ||
    message.includes('public.mystery_tickets') ||
    message.includes('public.mystery_spins')
  );
}

export function getMysterySetupErrorMessage(): string {
  return 'Falta configurar la ruleta en Supabase. Ejecuta database/mystery_roulette_bootstrap.sql en SQL Editor y recarga.';
}
