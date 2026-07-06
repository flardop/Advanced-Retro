import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import RetrovilleAdminContentForm from '@/components/retroville/admin/RetrovilleAdminContentForm';
import { getRetrovilleAdminContentData } from '@/lib/retroville-admin/data';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminContentPage() {
  const data = await getRetrovilleAdminContentData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Gestión de contenido"
        description="Editor interno para los copies sensibles de Retroville: hero, buyer brief, email de contacto, reveal y estado de la waitlist."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Gestión de contenido' }]}
      />

      <RetrovilleAdminContentForm initialData={data} />
    </div>
  );
}
