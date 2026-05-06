'use client';

import React from 'react';
import Link from 'next/link';
import { logError } from '@/lib/admin/errorLogger';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void logError(error.message, `${error.stack || ''}\n${info.componentStack || ''}`, typeof window !== 'undefined' ? window.location.href : '', 'critical', {
      source: 'react-boundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center bg-[#0b1020] px-6 text-center text-white">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">AdvancedRetro</p>
          <h1 className="mt-4 font-display text-4xl font-semibold">Se ha producido un error inesperado</h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300">
            Hemos registrado el problema para revisarlo. Puedes volver a la tienda o recargar esta página.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
            <Link href="/" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">
              Ir a la tienda
            </Link>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
