import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/blogPosts';

export const BLOG_DISCUSSION_GENERAL_SLUG = 'comunidad-general';
export const BLOG_DISCUSSION_GENERAL_TITLE = 'Comunidad general';

export function isBlogDiscussionGeneralSlug(slug: string): boolean {
  return String(slug || '').trim().toLowerCase() === BLOG_DISCUSSION_GENERAL_SLUG;
}

export function isSupportedBlogDiscussionSlug(slug: string): boolean {
  const safeSlug = String(slug || '').trim().toLowerCase();
  return isBlogDiscussionGeneralSlug(safeSlug) || Boolean(getBlogPostBySlug(safeSlug));
}

export function resolveBlogDiscussionTitle(slug: string): string {
  const safeSlug = String(slug || '').trim().toLowerCase();
  if (isBlogDiscussionGeneralSlug(safeSlug)) return BLOG_DISCUSSION_GENERAL_TITLE;
  return getBlogPostBySlug(safeSlug)?.title || 'Artículo de blog';
}

export function listBlogDiscussionSlugs(): string[] {
  return [BLOG_DISCUSSION_GENERAL_SLUG, ...BLOG_POSTS.map((post) => post.slug)];
}

export function listBlogDiscussionTargets(): Array<{
  slug: string;
  title: string;
  type: 'general' | 'article';
}> {
  return [
    {
      slug: BLOG_DISCUSSION_GENERAL_SLUG,
      title: BLOG_DISCUSSION_GENERAL_TITLE,
      type: 'general',
    },
    ...BLOG_POSTS.map((post) => ({
      slug: post.slug,
      title: post.title,
      type: 'article' as const,
    })),
  ];
}
