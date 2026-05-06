import { ProductEditorForm } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';

export default function AdminNewProductPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader title="New Product" description="Crea una nueva ficha con pricing, imágenes, SEO y referencias externas." breadcrumbs={[{ label: 'Admin' }, { label: 'Products', href: '/admin/products' }, { label: 'New' }]} />
      <ProductEditorForm mode="new" />
    </div>
  );
}
