import type { Metadata } from 'next';
import Link from 'next/link';
import { COMMUNITY_MARKETPLACE_DISABLED_MESSAGE } from '@/lib/userListings';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Vendedores de comunidad desactivados',
  description: 'El directorio de vendedores del marketplace de usuarios está desactivado.',
  path: '/comunidad/vendedores',
  noIndex: true,
});

export default function CommunitySellersPage() {
  return (
    <section className="section">
      <div className="container max-w-3xl">
        <div className="glass p-6 sm:p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad AdvancedRetro</p>
          <h1 className="title-display mt-2 text-3xl sm:text-4xl">Vendedores desactivados</h1>
          <p className="mx-auto mt-3 max-w-2xl text-textMuted">{COMMUNITY_MARKETPLACE_DISABLED_MESSAGE}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/comunidad" className="button-primary">Volver a comunidad</Link>
            <Link href="/tienda" className="button-secondary">Ver tienda oficial</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
