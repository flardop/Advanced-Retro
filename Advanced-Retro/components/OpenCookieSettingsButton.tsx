'use client';

import { COOKIE_SETTINGS_EVENT } from '@/lib/cookieConsent';

export default function OpenCookieSettingsButton() {
  return (
    <button
      type="button"
      className="button-secondary"
      onClick={() => {
        window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
      }}
    >
      Configurar cookies
    </button>
  );
}

