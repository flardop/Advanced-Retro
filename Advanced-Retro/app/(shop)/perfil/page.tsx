import type { Metadata } from 'next';
import ProfileView from '@/components/sections/ProfileView';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Mi perfil',
  description: 'Área privada de usuario con pedidos, tickets, cartera, insignias y ajustes de cuenta.',
  path: '/perfil',
  noIndex: true,
});

export default function ProfilePage() {
  return <ProfileView />;
}
