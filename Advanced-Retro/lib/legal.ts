import { getSiteUrl } from '@/lib/siteConfig';

function readPublicEnv(key: string, fallback = ''): string {
  return String(process.env[key] || fallback).trim();
}

export const SITE_URL = getSiteUrl();
export const PUBLIC_SUPPORT_EMAIL = readPublicEnv('NEXT_PUBLIC_CONTACT_EMAIL', 'soporte@advancedretro.es');
export const PRIVACY_CONTACT_EMAIL = readPublicEnv('NEXT_PUBLIC_PRIVACY_EMAIL', PUBLIC_SUPPORT_EMAIL);
export const PUBLIC_CONTACT_PHONE = readPublicEnv('NEXT_PUBLIC_CONTACT_PHONE', '');
export const LEGAL_OWNER_NAME = readPublicEnv('NEXT_PUBLIC_LEGAL_OWNER_NAME', 'Pendiente de completar');
export const LEGAL_TAX_ID = readPublicEnv('NEXT_PUBLIC_LEGAL_TAX_ID', 'Pendiente de completar');
export const LEGAL_ADDRESS_LINE1 = readPublicEnv('NEXT_PUBLIC_LEGAL_ADDRESS_LINE1', 'Pendiente de completar');
export const LEGAL_POSTAL_CODE = readPublicEnv('NEXT_PUBLIC_LEGAL_POSTAL_CODE', '');
export const LEGAL_CITY = readPublicEnv('NEXT_PUBLIC_LEGAL_CITY', '');
export const LEGAL_REGION = readPublicEnv('NEXT_PUBLIC_LEGAL_REGION', '');
export const LEGAL_COUNTRY = readPublicEnv('NEXT_PUBLIC_LEGAL_COUNTRY', 'España');
export const LEGAL_REGISTRY = readPublicEnv('NEXT_PUBLIC_LEGAL_REGISTRY', 'No informado');

export const LEGAL_FULL_ADDRESS = [
  LEGAL_ADDRESS_LINE1,
  [LEGAL_POSTAL_CODE, LEGAL_CITY].filter(Boolean).join(' '),
  LEGAL_REGION,
  LEGAL_COUNTRY,
]
  .filter(Boolean)
  .join(', ');

export const HAS_COMPLETE_LEGAL_IDENTITY = [
  LEGAL_OWNER_NAME,
  LEGAL_TAX_ID,
  LEGAL_ADDRESS_LINE1,
  LEGAL_POSTAL_CODE,
  LEGAL_CITY,
].every((value) => value && !value.toLowerCase().includes('pendiente'));
