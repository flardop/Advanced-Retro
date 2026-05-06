'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PackageSearch,
  Settings,
  ShoppingCart,
  Users,
  Wifi,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  live?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

const sections: SidebarSection[] = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/online', label: 'Online Now', icon: Wifi, live: true },
    ],
  },
  {
    label: 'CATALOG',
    items: [
      { href: '/admin/products', label: 'Products', icon: Boxes },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    label: 'COMMUNICATIONS',
    items: [{ href: '/admin/emails', label: 'Emails', icon: Mail }],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/admin/errors', label: 'Error Logs', icon: AlertTriangle },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({ onlineCount = 0 }: { onlineCount?: number }) {
  const pathname = usePathname() || '/admin/dashboard';
  const [collapsed, setCollapsed] = useState(false);

  const activeHref = useMemo(() => {
    const sorted = sections.flatMap((section) => section.items).sort((a, b) => b.href.length - a.href.length);
    return sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href || '/admin/dashboard';
  }, [pathname]);

  return (
    <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-surface)] transition-all duration-300 lg:flex ${collapsed ? 'w-[92px]' : 'w-[280px]'}`}>
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-5">
          <div className={`${collapsed ? 'hidden' : 'block'}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-text-muted)]">AdvancedRetro</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--admin-text)]">Admin Panel</h2>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-2 text-[var(--admin-text)]"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--admin-text-muted)] ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? '•' : section.label}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeHref === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${active ? 'bg-[rgba(108,99,255,0.16)] text-white shadow-[0_12px_30px_rgba(108,99,255,0.22)]' : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]'} ${collapsed ? 'justify-center' : ''}`}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {item.live ? (
                          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-slate-950">
                            {Math.min(99, onlineCount)}
                          </span>
                        ) : null}
                      </div>
                      {!collapsed ? <span className="font-medium">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--admin-border)] px-4 py-4 text-xs text-[var(--admin-text-muted)]">
          <div className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-3 ${collapsed ? 'text-center' : ''}`}>
            <PackageSearch className="mx-auto h-4 w-4 text-[var(--admin-accent)]" />
            {!collapsed ? <p className="mt-2">Panel conectado a Supabase y catálogo de tienda en tiempo real.</p> : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
