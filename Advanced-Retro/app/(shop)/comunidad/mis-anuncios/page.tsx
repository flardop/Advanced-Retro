import type { Metadata } from 'next';
import Link from 'next/link';
import { COMMUNITY_MARKETPLACE_DISABLED_MESSAGE } from '@/lib/userListings';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Mis anuncios desactivados',
  description: 'El marketplace de usuarios de AdvancedRetro está desactivado.',
  path: '/comunidad/mis-anuncios',
  noIndex: true,
});

export default function CommunityMyListingsPage() {
  return (
    <section className="section">
      <div className="container max-w-3xl">
        <div className="glass p-6 sm:p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad AdvancedRetro</p>
          <h1 className="title-display mt-2 text-3xl sm:text-4xl">Anuncios desactivados</h1>
          <p className="mx-auto mt-3 max-w-2xl text-textMuted">{COMMUNITY_MARKETPLACE_DISABLED_MESSAGE}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/comunidad" className="button-primary">Volver a comunidad</Link>
            <Link href="/perfil?tab=tickets" className="button-secondary">Abrir soporte</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
