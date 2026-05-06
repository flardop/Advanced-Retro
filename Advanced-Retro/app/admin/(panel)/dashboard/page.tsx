/* eslint-disable @next/next/no-img-element */
import { Boxes, DollarSign, PackageCheck, ShoppingCart, Users, Wifi } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { AreaChart, BarChart, DonutChart } from '@/components/admin/ui/Charts';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { DashboardLiveFeed } from '@/components/admin/AdminForms';
import { getDashboardSnapshot } from '@/lib/admin/data';
import { toCurrency, toDateTimeLabel } from '@/lib/admin/format';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { range?: '7d' | '30d' | '90d' | '1y' };
}) {
  const range = searchParams?.range || '30d';
  const snapshot = await getDashboardSnapshot(range);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Visión global del negocio, actividad en directo y salud operativa del storefront."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Revenue" value={snapshot.stats.totalRevenueCents / 100} trend={snapshot.stats.revenueChangePct} icon={<DollarSign className="h-5 w-5" />} format="currency" />
        <StatCard label="Total Orders" value={snapshot.stats.totalOrders} trend={snapshot.stats.ordersChangePct} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="New Users" value={snapshot.stats.newUsers} trend={snapshot.stats.usersChangePct} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Users Right Now" value={snapshot.stats.activeUsers} icon={<Wifi className="h-5 w-5" />} />
        <StatCard label="Total Products" value={snapshot.stats.totalProducts} icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Pending Orders" value={snapshot.stats.pendingOrders} icon={<PackageCheck className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <AreaChart data={snapshot.revenueSeries} title="Revenue Over Time" />
        <DonutChart data={snapshot.ordersStatus} title="Orders by Status" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <BarChart data={snapshot.topVisitedProducts.map((item) => ({ label: item.name, value: item.views }))} title="Top 10 Most Visited Products" horizontal />
        <DonutChart data={snapshot.trafficByDevice} title="Traffic by Device" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Recent Orders</h3>
          <div className="mt-4 space-y-3">
            {snapshot.recentOrders.map((order: any) => (
              <div key={order.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--admin-text)]">Pedido {String(order.id).slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{order.user?.email || 'Cliente sin email'}</p>
                  </div>
                  <strong className="text-[var(--admin-text)]">{toCurrency(Number(order.total || 0) / 100)}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Recent Sign-ups</h3>
          <div className="mt-4 space-y-3">
            {snapshot.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name || user.email} className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(108,99,255,0.16)] text-sm font-semibold text-[var(--admin-accent)]">{user.email.slice(0, 1).toUpperCase()}</div>}
                <div>
                  <p className="font-medium text-[var(--admin-text)]">{user.full_name || 'Sin nombre'}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{user.email} · {user.created_at ? toDateTimeLabel(user.created_at) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Recent Errors</h3>
          <div className="mt-4 space-y-3">
            {snapshot.recentErrors.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[var(--admin-text)]">{item.message}</p>
                  <span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(item.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{item.url || 'Sin URL'}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <DashboardLiveFeed initialItems={snapshot.liveActivity} />
    </div>
  );
}
