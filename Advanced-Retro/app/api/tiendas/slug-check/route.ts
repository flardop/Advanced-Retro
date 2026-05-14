import { NextRequest } from 'next/server';
import { slugIsTaken, slugifyStoreName } from '@/lib/storefronts';

export async function GET(request: NextRequest) {
  const slugParam = request.nextUrl.searchParams.get('slug') || '';
  const slug = slugifyStoreName(slugParam);
  if (!slug) {
    return Response.json({ success: true, available: false, slug: '' });
  }

  const taken = await slugIsTaken(slug);
  return Response.json({ success: true, available: !taken, slug });
}
