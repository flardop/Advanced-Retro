import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'Admin',
  description: 'Panel privado de administración de AdvancedRetro.es.',
  path: '/admin',
  noIndex: true,
});

export default async function AdminPage() {
  redirect('/admin/dashboard');
}
