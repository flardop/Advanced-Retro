export type BlogDiscussionSort = 'top' | 'new';

export type BlogDiscussionReply = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export type BlogDiscussionComment = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  replies: BlogDiscussionReply[];
};

export type BlogDiscussionPreview = {
  id: string;
  blogSlug: string;
  blogTitle: string;
  authorName: string;
  authorAvatarUrl: string | null;
  userId: string;
  title: string;
  body: string;
  score: number;
  commentsCount: number;
  currentUserVote: -1 | 0 | 1;
  createdAt: string;
  updatedAt: string;
};

export type BlogDiscussionThread = BlogDiscussionPreview & {
  comments: BlogDiscussionComment[];
};
