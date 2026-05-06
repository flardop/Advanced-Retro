'use client';

import { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)]/70 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(108,99,255,0.12)] text-2xl text-[var(--admin-primary)]">
        ◌
      </div>
      <h3 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--admin-text-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
