import type { Metadata } from 'next';
import CheckoutView from '@/components/sections/CheckoutView';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Checkout',
  description: 'Proceso de pago seguro en AdvancedRetro.es.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutView />;
}
