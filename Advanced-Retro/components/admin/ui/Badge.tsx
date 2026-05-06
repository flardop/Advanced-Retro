'use client';

import { ReactNode } from 'react';

const variantMap = {
  default: 'border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-[var(--admin-text)]',
  info: 'border-[rgba(108,99,255,0.35)] bg-[rgba(108,99,255,0.14)] text-[var(--admin-accent)]',
  success: 'border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.14)] text-[var(--admin-success)]',
  warning: 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.14)] text-[var(--admin-warning)]',
  error: 'border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.14)] text-[var(--admin-error)]',
};

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: keyof typeof variantMap;
}) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variantMap[variant]}`}>
      {children}
    </span>
  );
}
