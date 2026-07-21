'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const GOOGLE_ADS_ID = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '').trim();

function buildSendTo(label?: string) {
  const normalizedLabel = String(label || '').trim();
  if (!GOOGLE_ADS_ID || !normalizedLabel) return null;
  return `${GOOGLE_ADS_ID}/${normalizedLabel}`;
}

export function trackGoogleAdsConversion(
  label?: string,
  options?: {
    value?: number;
    currency?: string;
  }
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const sendTo = buildSendTo(label);
  if (!sendTo) return;

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: options?.value ?? 1,
    currency: options?.currency || 'EUR',
  });
}
