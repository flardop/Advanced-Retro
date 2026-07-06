'use client';

import Image from 'next/image';
import Link from 'next/link';
import { startTransition, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  FilePenLine,
  LayoutDashboard,
  LogOut,
  Menu,
  SearchCode,
  Settings2,
  Users,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  RETROVILLE_ADMIN_DASHBOARD_PATH,
  RETROVILLE_ADMIN_HOME_PATH,
  RETROVILLE_ADMIN_NAV_ITEMS,
} from '@/lib/retroville-admin/constants';

const iconMap: Record<string, LucideIcon> = {
  '/retroville/admin/dashboard': LayoutDashboard,
  '/retroville/admin/usuarios': Users,
  '/retroville/admin/analiticas': BarChart3,
  '/retroville/admin/tiempo-real': Wifi,
  '/retroville/admin/seo': SearchCode,
  '/retroville/admin/errores': AlertTriangle,
  '/retroville/admin/contenido': FilePenLine,
  '/retroville/admin/configuracion': Settings2,
};

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = iconMap[href] || LayoutDashboard;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? 'border-[rgba(192,57,43,0.45)] bg-[rgba(192,57,43,0.18)] text-[var(--admin-text)] shadow-[0_18px_40px_rgba(192,57,43,0.14)]'
          : 'border-transparent text-[var(--admin-text-muted)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function RetrovilleAdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || RETROVILLE_ADMIN_DASHBOARD_PATH;
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeHref = useMemo(() => {
    const sorted = [...RETROVILLE_ADMIN_NAV_ITEMS].sort((left, right) => right.href.length - left.href.length);
    return (
      sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ||
      RETROVILLE_ADMIN_DASHBOARD_PATH
    );
  }, [pathname]);

  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    startTransition(async () => {
      try {
        await fetch('/api/retroville/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } finally {
        router.replace(RETROVILLE_ADMIN_HOME_PATH);
        router.refresh();
        setLoggingOut(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]" style={{ fontFamily: 'var(--admin-sans)' }}>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[304px] shrink-0 border-r border-[var(--admin-border)] bg-[#111111] lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--admin-border)] px-6 py-6">
              <Link href={RETROVILLE_ADMIN_DASHBOARD_PATH} className="flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-black/40">
                  <Image
                    src="/images/retroville/retroville-logo.png"
                    alt="Retroville"
                    fill
                    className="object-contain p-2"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--admin-text-muted)]">Retroville</p>
                  <p className="mt-1 text-sm font-medium text-[var(--admin-text)]">Panel privado</p>
                </div>
              </Link>
              <div className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--admin-text-muted)]">Admin</p>
                <p className="mt-2 truncate text-sm text-[var(--admin-text)]">{email}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
              {RETROVILLE_ADMIN_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} active={activeHref === item.href} />
              ))}
            </nav>

            <div className="border-t border-[var(--admin-border)] p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(192,57,43,0.35)] bg-[rgba(192,57,43,0.14)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] transition hover:bg-[rgba(192,57,43,0.2)] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[rgba(14,14,14,0.92)] backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <Link href={RETROVILLE_ADMIN_DASHBOARD_PATH} className="flex min-w-0 items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-black/40">
                  <Image
                    src="/images/retroville/retroville-logo.png"
                    alt="Retroville"
                    fill
                    className="object-contain p-2"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--admin-text)]">Retroville Admin</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">{email}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-[var(--admin-text)]"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            {mobileMenuOpen ? (
              <div className="space-y-2 border-t border-[var(--admin-border)] px-4 py-4">
                {RETROVILLE_ADMIN_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    active={activeHref === item.href}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(192,57,43,0.35)] bg-[rgba(192,57,43,0.14)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
                </button>
              </div>
            ) : null}
          </header>

          <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
