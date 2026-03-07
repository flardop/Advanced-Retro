import type { Metadata } from 'next';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/blogPosts';
import { absoluteUrl } from '@/lib/siteConfig';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) {
    return buildPageMetadata({
      title: 'Artículo retro',
      description: 'Contenido de blog de AdvancedRetro.es',
      path: '/blog',
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: post.image,
    keywords: post.keywords,
    type: 'article',
  });
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) notFound();

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: [absoluteUrl(post.image)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: {
      '@type': 'Organization',
      name: 'AdvancedRetro.es',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AdvancedRetro.es',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    articleSection: post.category,
    inLanguage: 'es-ES',
    keywords: post.keywords.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav
            items={[
              { name: 'Inicio', href: '/' },
              { name: 'Blog', href: '/blog' },
              { name: post.title },
            ]}
          />
        </div>
      </section>

      <article className="section pt-6">
        <div className="container glass p-6 sm:p-8 space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{post.category}</p>
          <h1 className="title-display text-3xl">{post.title}</h1>
          <p className="text-textMuted">
            {post.publishedAt} · Actualizado {post.updatedAt} · {post.readMinutes} min lectura
          </p>
          <p className="text-textMuted leading-relaxed">{post.description}</p>

          {post.sections.map((section) => (
            <section key={`${post.slug}-${section.heading}`} className="space-y-3">
              <h2 className="title-display text-2xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.heading}-${index}`} className="text-textMuted leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </>
  );
}

