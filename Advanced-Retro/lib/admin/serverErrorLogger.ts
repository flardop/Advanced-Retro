import type { ErrorSeverity } from '@/types/admin';
import { supabaseService } from '@/lib/supabase/service';

function guessSeverity(error: unknown): ErrorSeverity {
  if (!(error instanceof Error)) return 'error';
  const message = error.message.toLowerCase();
  if (message.includes('critical')) return 'critical';
  if (message.includes('warn')) return 'warning';
  return 'error';
}

export async function serverLogError(
  error: unknown,
  extra?: Record<string, unknown>,
  severity?: ErrorSeverity
) {
  if (!supabaseService) return;
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const stack = error instanceof Error ? error.stack || null : null;

  await supabaseService.from('error_logs').insert({
    message: message.slice(0, 2000),
    stack_trace: stack,
    url: typeof extra?.url === 'string' ? extra.url : null,
    severity: severity || guessSeverity(error),
    extra_data: extra || null,
  });
}
