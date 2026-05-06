import type { Metadata } from 'next';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import BlogDiscussionThreadView from '@/components/blog/BlogDiscussionThreadView';
import { isBlogDiscussionGeneralSlug } from '@/lib/blogDiscussionChannels';
import { getBlogDiscussionById } from '@/lib/blogDiscussions';
import {
  buildBreadcrumbJsonLd,
  buildDiscussionForumPostingJsonLd,
  buildPageMetadata,
} from '@/lib/seo';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function isStarterEditorialPersona(userId: string | null | undefined): boolean {
  return String(userId || '').startsWith('starter-editorial:');
}

type BlogDiscussionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: BlogDiscussionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const discussion = await getBlogDiscussionById(resolvedParams.id);

  if (!discussion) {
    return buildPageMetadata({
      title: 'Discusión no encontrada',
      description: 'No se ha encontrado la discusión del blog que buscas.',
      path: '/blog',
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${discussion.title} | Debate del blog`,
    description: discussion.body.slice(0, 155),
    path: `/blog/discusiones/${discussion.id}`,
    noIndex: false,
  });
}

export default async function BlogDiscussionPage({
  params,
}: BlogDiscussionPageProps) {
  const resolvedParams = await params;
  const discussion = await getBlogDiscussionById(resolvedParams.id);
  if (!discussion) notFound();

  const breadcrumbItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Blog', href: '/blog' },
    ...(isBlogDiscussionGeneralSlug(discussion.blogSlug)
      ? [{ name: discussion.blogTitle }]
      : [{ name: discussion.blogTitle, href: `/blog/${discussion.blogSlug}` }]),
    { name: 'Discusión' },
  ];
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    ...(isBlogDiscussionGeneralSlug(discussion.blogSlug)
      ? [{ name: discussion.blogTitle, path: '/blog' }]
      : [{ name: discussion.blogTitle, path: `/blog/${discussion.blogSlug}` }]),
    { name: discussion.title, path: `/blog/discusiones/${discussion.id}` },
  ]);
  const discussionSchema = isStarterEditorialPersona(discussion.userId)
    ? null
    : buildDiscussionForumPostingJsonLd({
        title: discussion.title,
        body: discussion.body,
        path: `/blog/discusiones/${discussion.id}`,
        authorName: discussion.authorName,
        publishedAt: discussion.createdAt,
        updatedAt: discussion.updatedAt,
        discussionLabel: discussion.blogTitle,
      });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {discussionSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionSchema) }}
        />
      ) : null}
      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </section>

      <section className="section pt-6">
        <div className="wide-content-rail">
          <BlogDiscussionThreadView
            discussionId={discussion.id}
            initialDiscussion={discussion}
          />
        </div>
      </section>
    </>
  );
}
