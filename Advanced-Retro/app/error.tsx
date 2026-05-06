'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-text font-body">
        <section className="section min-h-screen flex items-center">
          <div className="container">
            <div className="wide-content-rail">
              <div className="glass p-8 sm:p-10">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">Error temporal</p>
                <h1 className="title-display mt-3 text-3xl sm:text-4xl">Algo no ha cargado como debía</h1>
                <p className="mt-3 max-w-2xl text-textMuted">
                  Hemos capturado el error para que no rompa la navegación. Puedes reintentar ahora mismo o volver a una zona segura de la tienda.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => reset()} className="button-primary">
                    Reintentar
                  </button>
                  <Link href="/tienda" className="button-secondary">Ir al catálogo</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
