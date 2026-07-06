import { redirect } from 'next/navigation';
import { RETROVILLE_ADMIN_HOME_PATH } from '@/lib/retroville-admin/constants';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminLoginPage({
  searchParams,
}: {
  searchParams?: { redirectedFrom?: string | string[] };
}) {
  const redirectedFrom = Array.isArray(searchParams?.redirectedFrom)
    ? searchParams.redirectedFrom[0]
    : searchParams?.redirectedFrom;

  redirect(
    redirectedFrom
      ? `${RETROVILLE_ADMIN_HOME_PATH}?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
      : RETROVILLE_ADMIN_HOME_PATH
  );
}
