import { AreaChart, DonutChart } from '@/components/admin/ui/Charts';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { OrdersTableView } from '@/components/admin/AdminDataViews';
import { listAdminOrders } from '@/lib/admin/data';

function series(rows: any[], valueSelector: (row: any) => number) {
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const date = new Date(row.created_at);
    const key = `${date.getDate()}/${date.getMonth() + 1}`;
    buckets.set(key, (buckets.get(key) || 0) + valueSelector(row));
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export default async function AdminOrdersPage() {
  const rows = await listAdminOrders();
  const last30 = rows.filter((row) => new Date(row.created_at).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000);
  const statusMap = new Map<string, number>();
  for (const row of rows) {
    const status = String(row.meta?.fulfillment_status || row.status || 'pending');
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Orders" description="Seguimiento de pedidos, pagos, logística y comunicación con clientes." breadcrumbs={[{ label: 'Admin' }, { label: 'Orders' }]} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1"><AreaChart data={series(last30, () => 1)} title="Orders per day" /></div>
        <div className="xl:col-span-1"><AreaChart data={series(last30, (row) => Number(row.total || 0) / 100)} title="Revenue per day" /></div>
        <div className="xl:col-span-1"><DonutChart data={Array.from(statusMap.entries()).map(([label, value]) => ({ label, value }))} title="Orders by status" /></div>
      </div>
      <OrdersTableView rows={rows} />
    </div>
  );
}
