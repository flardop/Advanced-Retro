'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  createDefaultConsent,
  normalizeConsent,
  type CookieConsentState,
} from '@/lib/cookieConsent';
import { GOOGLE_ADS_ID } from '@/lib/marketing/googleAds';

function readConsent(): CookieConsentState {
  if (typeof window === 'undefined') return createDefaultConsent();
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return createDefaultConsent();
  try {
    return normalizeConsent(JSON.parse(raw));
  } catch {
    return createDefaultConsent();
  }
}

export default function OptionalAnalytics() {
  const gaMeasurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
  const googleTagId = gaMeasurementId || GOOGLE_ADS_ID;
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const initial = readConsent();
    setAnalyticsEnabled(Boolean(initial.analytics));

    const onChanged = (event: Event) => {
      const custom = event as CustomEvent<CookieConsentState>;
      if (custom.detail) {
        setAnalyticsEnabled(Boolean(custom.detail.analytics));
        return;
      }
      const current = readConsent();
      setAnalyticsEnabled(Boolean(current.analytics));
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
  }, []);

  if (!analyticsEnabled) return null;

  return (
    <>
      {googleTagId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-optional" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); ${
              gaMeasurementId ? `gtag('config', '${gaMeasurementId}', { anonymize_ip: true });` : ''
            } ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ''}`}
          </Script>
        </>
      ) : null}
      <Analytics />
    </>
  );
}
