'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${widthClass} rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
          <button
            type="button"
            className="rounded-full border border-[var(--admin-border)] p-2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text)]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
