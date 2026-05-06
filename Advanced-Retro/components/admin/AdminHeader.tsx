/* eslint-disable @next/next/no-img-element */
'use client';

import { Bell, LogOut, Search, Settings, UserCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { AdminProfile } from '@/types/admin';

export default function AdminHeader({ profile }: { profile: AdminProfile | null }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin/dashboard';
  const [notificationCount, setNotificationCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/notifications/summary', { cache: 'no-store' });
        const payload = await res.json();
        if (active && payload?.success) {
          setNotificationCount(Number(payload.data?.count || 0));
        }
      } catch {
        if (active) setNotificationCount(0);
      }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const breadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean).slice(1);
    if (!parts.length) return ['Dashboard'];
    return parts.map((part) => part.replace(/-/g, ' '));
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[rgba(10,10,15,0.88)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
            {breadcrumbs.map((item, index) => (
              <span key={`${item}-${index}`} className="capitalize">
                {item}
                {index < breadcrumbs.length - 1 ? ' /' : ''}
              </span>
            ))}
          </div>
          <h1 className="mt-1 text-xl font-semibold text-[var(--admin-text)]">Centro de control</h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text-muted)]">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pedidos, productos, usuarios..."
              className="w-full bg-transparent text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)]"
            />
          </label>

          <div className="flex items-center gap-3">
            <Link href="/admin/errors" className="relative rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-[var(--admin-text)]">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--admin-error)] px-1 text-[10px] font-bold text-white">
                  {Math.min(notificationCount, 99)}
                </span>
              ) : null}
            </Link>

            <div className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[rgba(108,99,255,0.18)] text-[var(--admin-accent)]">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || 'Admin'} className="h-full w-full object-cover" /> : <UserCircle2 className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{profile?.full_name || profile?.email || 'Administrador'}</p>
                <p className="truncate text-xs text-[var(--admin-text-muted)]">{profile?.email || 'admin@advancedretro.es'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/settings" className="rounded-xl border border-[var(--admin-border)] p-2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text)]">
                  <Settings className="h-4 w-4" />
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-xl border border-[var(--admin-border)] p-2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text)]">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
