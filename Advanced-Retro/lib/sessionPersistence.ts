export const REMEMBER_SESSION_KEY = 'advancedretro-remember-session';

export type RememberSessionPreset =
  | '12h'
  | '7d'
  | '30d'
  | '180d'
  | '365d'
  | 'forever';

type RememberSessionPreference = {
  preset: RememberSessionPreset;
  expiresAt: number | null;
};

const PRESET_TO_MS: Record<Exclude<RememberSessionPreset, 'forever'>, number> = {
  '12h': 12 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '180d': 180 * 24 * 60 * 60 * 1000,
  '365d': 365 * 24 * 60 * 60 * 1000,
};

export function buildRememberSessionPreference(
  preset: RememberSessionPreset
): RememberSessionPreference {
  return {
    preset,
    expiresAt:
      preset === 'forever' ? null : Date.now() + PRESET_TO_MS[preset],
  };
}

export function persistRememberSessionPreference(
  preset: RememberSessionPreset
) {
  if (typeof window === 'undefined') return;
  const payload = buildRememberSessionPreference(preset);
  window.localStorage.setItem(REMEMBER_SESSION_KEY, JSON.stringify(payload));
}

export function readRememberSessionPreference():
  | RememberSessionPreference
  | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(REMEMBER_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RememberSessionPreference>;
    const preset = String(parsed?.preset || '') as RememberSessionPreset;
    const validPreset =
      preset === '12h' ||
      preset === '7d' ||
      preset === '30d' ||
      preset === '180d' ||
      preset === '365d' ||
      preset === 'forever';

    if (!validPreset) return null;

    return {
      preset,
      expiresAt:
        preset === 'forever'
          ? null
          : Number.isFinite(parsed?.expiresAt)
            ? Number(parsed?.expiresAt)
            : null,
    };
  } catch {
    return null;
  }
}

export function clearRememberSessionPreference() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REMEMBER_SESSION_KEY);
}

export function isRememberSessionExpired() {
  const preference = readRememberSessionPreference();
  if (!preference) return false;
  if (preference.expiresAt == null) return false;
  return preference.expiresAt <= Date.now();
}
