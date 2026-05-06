'use client';

import type { AdminProfile } from '@/types/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { NotificationToast } from '@/components/admin/ui/NotificationToast';

export default function AdminLayout({
  children,
  profile,
  onlineCount = 0,
}: {
  children: React.ReactNode;
  profile: AdminProfile | null;
  onlineCount?: number;
}) {
  return (
    <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <div className="flex min-h-screen">
        <AdminSidebar onlineCount={onlineCount} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader profile={profile} />
          <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
      <NotificationToast />
    </div>
  );
}
