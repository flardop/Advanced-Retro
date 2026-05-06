import { notFound } from 'next/navigation';
import { EmailTemplateEditor } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getEmailTemplateById } from '@/lib/admin/emailService';

export default async function AdminEmailTemplateDetailPage({ params }: { params: { id: string } }) {
  const template = await getEmailTemplateById(params.id);
  if (!template) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader title={template.name} description="Edita asunto, HTML y variables disponibles de la plantilla." breadcrumbs={[{ label: 'Admin' }, { label: 'Emails', href: '/admin/emails' }, { label: 'Templates', href: '/admin/emails/templates' }, { label: template.name }]} />
      <EmailTemplateEditor template={template} />
    </div>
  );
}
