import { retrovilleAdminThemeStyle } from '@/lib/retroville-admin/theme';

export default function RetrovilleAdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]"
      style={retrovilleAdminThemeStyle}
    >
      {children}
    </div>
  );
}
