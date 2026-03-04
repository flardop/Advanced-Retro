'use client';

import { Toaster } from 'react-hot-toast';

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#11131a',
          color: '#f5f7ff',
          border: '1px solid #24283a',
        },
      }}
    />
  );
}
