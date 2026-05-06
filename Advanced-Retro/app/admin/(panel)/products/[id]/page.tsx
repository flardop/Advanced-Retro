import { notFound } from 'next/navigation';
import { ProductEditorForm } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getAdminProductDetail } from '@/lib/admin/data';

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getAdminProductDetail(params.id);
  if (!product) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader title={String(product.name || 'Editar producto')} description="Edita contenido, stock, precios, SEO e imágenes del producto." breadcrumbs={[{ label: 'Admin' }, { label: 'Products', href: '/admin/products' }, { label: String(product.name || 'Producto') }]} />
      <ProductEditorForm mode="edit" initialProduct={product} />
    </div>
  );
}
