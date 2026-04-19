import type { Metadata } from 'next';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import BlogDiscussionThreadView from '@/components/blog/BlogDiscussionThreadView';
import { isBlogDiscussionGeneralSlug } from '@/lib/blogDiscussionChannels';
import { getBlogDiscussionById } from '@/lib/blogDiscussions';
import { buildPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

  return (
    <>
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
