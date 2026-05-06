'use client';

import { Toaster } from 'sonner';

export function NotificationToast() {
  return (
    <Toaster
      richColors
      closeButton
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          color: 'var(--admin-text)',
        },
      }}
    />
  );
}
