'use client';

import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  clearRememberSessionPreference,
  isRememberSessionExpired,
} from '@/lib/sessionPersistence';

export default function SessionPersistenceGuard() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    const validateSession = async () => {
      if (!isRememberSessionExpired()) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || cancelled) {
        clearRememberSessionPreference();
        return;
      }

      await supabase.auth.signOut();
      clearRememberSessionPreference();
    };

    validateSession();

    const interval = window.setInterval(validateSession, 60 * 1000);
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearRememberSessionPreference();
        return;
      }
      validateSession();
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
