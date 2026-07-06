import type { CSSProperties } from 'react';

export const retrovilleAdminThemeStyle: CSSProperties = {
  ['--admin-bg' as string]: '#0e0e0e',
  ['--admin-surface' as string]: '#161616',
  ['--admin-surface-2' as string]: '#111111',
  ['--admin-border' as string]: '#2a2a2a',
  ['--admin-primary' as string]: '#c0392b',
  ['--admin-primary-hover' as string]: '#a93226',
  ['--admin-accent' as string]: '#d85a4d',
  ['--admin-success' as string]: '#57c579',
  ['--admin-warning' as string]: '#ffbf52',
  ['--admin-error' as string]: '#e05d4f',
  ['--admin-text' as string]: '#e8e4dc',
  ['--admin-text-muted' as string]: '#7a7570',
  ['--admin-mono' as string]: '"Space Mono", "Courier New", monospace',
  ['--admin-sans' as string]: 'Helvetica, system-ui, sans-serif',
};

export function formatAdminDuration(seconds: number) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

export function formatAdminPercent(value: number, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}
