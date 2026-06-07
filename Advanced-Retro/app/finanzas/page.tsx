import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import FinanceHubGuestPreview from '@/components/finance/FinanceHubGuestPreview';
import { buildPageMetadata } from '@/lib/seo';

const FinanceHub = dynamic(() => import('@/components/finance/FinanceHub'), {
  ssr: false,
  loading: () => <FinanceHubGuestPreview loading />,
});

export const metadata: Metadata = buildPageMetadata({
  title: 'Finanzas y productividad personal',
  description:
    'Agenda diaria, notas, hábitos repetibles, racha de autocontrol y seguimiento financiero personal dentro de AdvancedRetro.',
  path: '/finanzas',
  keywords: [
    'agenda personal advancedretro',
    'finanzas personales advancedretro',
    'seguimiento de hábitos',
    'control de gastos',
    'feed ics personal',
  ],
  noIndex: true,
});

export default function FinanzasPage() {
  return <FinanceHub />;
}
