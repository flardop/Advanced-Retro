'use client';

import { ReactNode } from 'react';
import { Modal } from '@/components/admin/ui/Modal';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-lg">
      <p className="text-sm text-[var(--admin-text-muted)]">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="rounded-2xl border border-[var(--admin-border)] px-4 py-2 text-sm text-[var(--admin-text)]" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
            variant === 'danger' ? 'bg-[var(--admin-error)]' : 'bg-[var(--admin-warning)] text-black'
          }`}
          onClick={() => void onConfirm()}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
