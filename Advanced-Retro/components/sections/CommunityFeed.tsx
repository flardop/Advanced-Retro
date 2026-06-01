'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CommunityFeed() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const res = await fetch('/api/community/posts', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar publicaciones');
        if (!cancelled) setPosts(Array.isArray(data?.posts) ? data.posts : []);
      } catch {
        if (!cancelled) setPosts([]);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section" id="comunidad">
      <div className="mx-auto w-full max-w-[1320px] space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="glass overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad AdvancedRetro</p>
              <h2 className="title-display mt-2 text-3xl sm:text-4xl lg:text-5xl">
                Contenido, soporte y cultura retro
              </h2>
              <p className="mt-3 max-w-3xl text-textMuted">
                La comunidad queda enfocada en publicaciones, blog, soporte, torneos y novedades del ecosistema.
                Los productos de usuarios ya no se muestran ni se pueden publicar desde aquí.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="chip border-primary/50 text-primary">Sin anuncios de usuarios</span>
                <span className="chip">Soporte comprador ↔ tienda</span>
                <span className="chip">Blog y novedades</span>
                <span className="chip">Retroville y eventos</span>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-[radial-gradient(circle_at_20%_10%,rgba(115,198,255,0.18),transparent_34%),rgba(10,18,30,0.64)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              <p className="text-sm font-semibold text-text">Marketplace de usuarios desactivado</p>
              <p className="mt-2 text-sm leading-6 text-textMuted">
                AdvancedRetro mantiene la tienda oficial y la experiencia comunitaria, pero sin productos creados por usuarios.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Link href="/tienda" className="button-primary justify-center">Ir a la tienda oficial</Link>
                <Link href="/perfil?tab=tickets" className="button-secondary justify-center">Soporte</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="glass p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Qué puedes hacer</p>
            <div className="mt-4 grid gap-3">
              {[
                ['Leer guías y noticias', 'Contenido editorial, análisis y novedades de videojuegos retro.'],
                ['Pedir soporte', 'Tickets privados para compras, dudas y seguimiento.'],
                ['Seguir Retroville', 'Actualizaciones del universo narrativo y próximos lanzamientos.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
                  <p className="font-semibold text-text">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-textMuted">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Últimas publicaciones</p>
                <h3 className="mt-1 text-xl font-semibold text-text">Actividad de comunidad</h3>
              </div>
              <Link href="/blog" className="chip text-primary border-primary/50">Ir al blog</Link>
            </div>

            <div className="mt-4 grid gap-3">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
                  <p className="text-sm text-textMuted">Aún no hay posts de comunidad.</p>
                </div>
              ) : (
                posts.slice(0, 5).map((post) => (
                  <article key={post.id} className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
                    <p className="line-clamp-2 text-base font-semibold text-text">{String(post.title || 'Publicación')}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-textMuted">{String(post.content || '')}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
