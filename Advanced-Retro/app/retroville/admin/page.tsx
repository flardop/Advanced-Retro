import { redirect } from 'next/navigation';
import RetrovilleAdminAccessScreen from '@/components/retroville/admin/RetrovilleAdminAccessScreen';
import { getRetrovilleAdminContextFromCookies } from '@/lib/retroville-admin/auth';
import { RETROVILLE_ADMIN_DASHBOARD_PATH } from '@/lib/retroville-admin/constants';

export const dynamic = 'force-dynamic';

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RetrovilleAdminEntryPage({
  searchParams,
}: {
  searchParams?: { redirectedFrom?: string | string[] };
}) {
  try {
    const context = await getRetrovilleAdminContextFromCookies();
    if (context) {
      redirect(RETROVILLE_ADMIN_DASHBOARD_PATH);
    }
  } catch {
    // If the service is temporarily unavailable, keep the access route visible.
  }

  return <RetrovilleAdminAccessScreen redirectedFrom={readSearchParam(searchParams?.redirectedFrom)} />;
}
