import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { OrderManagementPanel } from '@/components/admin/AdminForms';
import { getAdminOrderDetail } from '@/lib/admin/data';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const detail = await getAdminOrderDetail(params.id);
  if (!detail.order) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader title={`Pedido ${String(detail.order.id).slice(0, 8).toUpperCase()}`} description="Detalle de líneas, timeline, estado logístico y comunicación con cliente." breadcrumbs={[{ label: 'Admin' }, { label: 'Orders', href: '/admin/orders' }, { label: String(detail.order.id).slice(0, 8).toUpperCase() }]} />
      <OrderManagementPanel order={detail.order} timeline={detail.timeline} />
    </div>
  );
}
