import { withAdminRoute } from '@/lib/admin/api';
import { getEmailTemplates } from '@/lib/admin/emailService';

export async function GET() {
  return withAdminRoute(async () => getEmailTemplates());
}
