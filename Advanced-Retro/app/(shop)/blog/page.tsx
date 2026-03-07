import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { BLOG_POSTS } from '@/lib/blogPosts';
import { buildBreadcrumbJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog retro | Guías de compra y coleccionismo',
  description:
    'Blog de AdvancedRetro.es con guías de compra retro, coleccionismo, precios de mercado y consejos para evitar errores.',
  path: '/blog',
  keywords: [
    'blog retro',
    'guia coleccionismo retro',
    'comprar videojuegos retro',
    'precio mercado retro',
  ],
});

export default function BlogPage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]);
  const itemListSchema = buildItemListJsonLd(
    BLOG_POSTS.map((post) => ({
      name: post.title,
      path: `/blog/${post.slug}`,
      image: post.image,
      description: post.description,
    })),
    'Blog retro AdvancedRetro.es'
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav items={[{ name: 'Inicio', href: '/' }, { name: 'Blog' }]} />
        </div>
      </section>

      <section className="section pt-6">
        <div className="container glass p-6 sm:p-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Blog retro</p>
          <h1 className="title-display text-3xl">Guías para comprar mejor en retro gaming</h1>
          <p className="text-textMuted leading-relaxed">
            Este blog está orientado a compradores y coleccionistas que quieren tomar decisiones con más contexto: estado real,
            completitud, precio de mercado y estrategia de compra por plataforma.
          </p>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container grid gap-4 xl:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="glass p-5 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">{post.category}</p>
              <h2 className="title-display text-xl leading-tight">{post.title}</h2>
              <p className="text-sm text-textMuted">{post.excerpt}</p>
              <p className="text-xs text-textMuted">
                {post.publishedAt} · {post.readMinutes} min lectura
              </p>
              <div className="mt-auto pt-1">
                <Link href={`/blog/${post.slug}`} className="button-secondary">
                  Leer artículo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

