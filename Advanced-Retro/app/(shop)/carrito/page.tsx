import type { Metadata } from 'next';
import CartView from '@/components/sections/CartView';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Carrito',
  description: 'Área de carrito de compra de AdvancedRetro.es.',
  path: '/carrito',
  noIndex: true,
});

export default function CartPage() {
  return <CartView />;
}
