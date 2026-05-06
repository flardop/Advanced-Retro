import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProductsTableView } from '@/components/admin/AdminDataViews';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { listAdminProducts } from '@/lib/admin/data';

export default async function AdminProductsPage() {
  const rows = await listAdminProducts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Products" description="Gestiona catálogo, pricing, stock, SEO y señales de mercado desde un único panel." breadcrumbs={[{ label: 'Admin' }, { label: 'Products' }]} />
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>
      <ProductsTableView rows={rows} />
    </div>
  );
}
