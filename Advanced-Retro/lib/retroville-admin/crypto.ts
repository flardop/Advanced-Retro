import { createHash, randomBytes } from 'crypto';

export function sha256Hex(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function hashIpAddress(value: string) {
  return sha256Hex(String(value || '0.0.0.0').trim() || '0.0.0.0');
}

export function generateSessionToken() {
  return randomBytes(32).toString('hex');
}
