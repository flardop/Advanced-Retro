import { headers } from 'next/headers';
import RetrovilleAdminShell from '@/components/retroville/admin/RetrovilleAdminShell';
import {
  getRequestIpAddress,
  getRequestUserAgent,
  recordRetrovilleAdminAccessLog,
  requireRetrovilleAdminPageSession,
} from '@/lib/retroville-admin/auth';
import { hashIpAddress } from '@/lib/retroville-admin/crypto';
import { retrovilleAdminThemeStyle } from '@/lib/retroville-admin/theme';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireRetrovilleAdminPageSession();
  const requestHeaders = headers();
  const headerBag = new Headers();

  requestHeaders.forEach((value, key) => {
    headerBag.set(key, value);
  });

  const ipAddress = getRequestIpAddress({ headers: headerBag });
  const userAgent = getRequestUserAgent({ headers: headerBag });

  await recordRetrovilleAdminAccessLog({
    userId: context.user.id,
    sessionId: context.session.id,
    email: context.user.email,
    ipHash: hashIpAddress(ipAddress),
    ipAddress,
    userAgent,
    eventType: 'access',
    details: {
      section: 'retroville-admin',
    },
  }).catch(() => null);

  return (
    <div style={retrovilleAdminThemeStyle}>
      <RetrovilleAdminShell email={context.user.email}>{children}</RetrovilleAdminShell>
    </div>
  );
}
