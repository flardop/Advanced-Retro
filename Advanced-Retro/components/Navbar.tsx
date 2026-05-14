'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import UsageSessionTracker from '@/components/UsageSessionTracker';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type NavLeaf = {
  href: string;
  label: string;
  description?: string;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavLeaf[];
};

function NavbarContent() {
  const pathname = usePathname() || '/';
  const { locale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<string | null>(null);
  const [mobileSections, setMobileSections] = useState<Record<string, boolean>>({
    tienda: true,
    universo: false,
    creadores: false,
  });

  const navGroups = useMemo<NavGroup[]>(() => [
    {
      key: 'tienda',
      label: 'Tienda',
      items: [
        { href: '/tienda', label: 'Catálogo completo', description: 'La tienda oficial de AdvancedRetro.' },
        { href: '/mystery-boxes', label: 'Mystery Boxes', description: 'Drops y cajas sorpresa del ecosistema.' },
        { href: '/subastas', label: 'Subastas', description: 'Lotes verificados y pujas en directo.' },
        { href: '/ruleta', label: 'Ruleta', description: 'Tickets y premios ligados a la capa mystery.' },
        { href: '/servicio-compra', label: 'Encargos', description: 'Búsqueda asistida de piezas concretas.' },
      ],
    },
    {
      key: 'universo',
      label: 'Universo',
      items: [
        { href: '/retroville', label: 'Retroville', description: 'El universo narrativo original de AdvancedRetro.' },
        { href: '/blog', label: 'Blog', description: 'Guías, criterio de compra y cultura retro.' },
      ],
    },
    {
      key: 'creadores',
      label: 'Creadores',
      items: [
        { href: '/memberships', label: 'Membresías', description: 'Niveles, ventajas y acceso preferente.' },
        { href: '/crear-tienda', label: 'Crear mi tienda', description: 'Lanza tu tienda dentro del ecosistema.' },
        { href: '/tiendas', label: 'Tiendas de la comunidad', description: 'Directorio de tiendas creadas por miembros.' },
      ],
    },
  ], []);

  const directLinks = useMemo<NavLeaf[]>(() => [
    { href: '/comunidad', label: t('nav.community', 'Comunidad') },
    { href: '/creator', label: 'Creador' },
  ], [t]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        window.removeEventListener('scroll', onScroll);
        listener.subscription.unsubscribe();
      };
    }

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const groupIsActive = (group: NavGroup) => group.items.some((item) => isItemActive(item.href));

  return (
    <>
      <UsageSessionTracker />
      <header
        className={`sticky top-0 z-50 border-b transition-all ${
          scrolled
            ? 'border-line/80 bg-[rgba(6,12,22,0.9)] shadow-[0_12px_30px_rgba(3,10,24,0.22)] backdrop-blur-xl'
            : 'border-line/50 bg-[rgba(6,12,22,0.76)] backdrop-blur-lg'
        }`}
      >
        <div className="container py-2.5">
          <div className="header-rail">
            <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(7,14,24,0.78)] px-3 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.14)] sm:px-4">
              <div className="flex min-h-[60px] items-center justify-between gap-3 sm:min-h-[66px]">
                <Link href="/" className="flex shrink-0 items-center rounded-xl px-1 py-1 hover:bg-white/5">
                  <Image
                    src="/logo.png"
                    alt="Advanced Retro"
                    width={178}
                    height={48}
                    className="h-9 w-auto object-contain logo-breath sm:h-10"
                    priority
                  />
                </Link>

                <nav className="hidden xl:flex xl:flex-1 xl:items-center xl:justify-center">
                  <div className="relative flex items-center gap-1.5" onMouseLeave={() => setDesktopMenu(null)}>
                    {navGroups.map((group) => {
                      const active = groupIsActive(group);
                      const expanded = desktopMenu === group.key;
                      return (
                        <div key={group.key} className="relative">
                          <button
                            type="button"
                            onMouseEnter={() => setDesktopMenu(group.key)}
                            onFocus={() => setDesktopMenu(group.key)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.92rem] transition ${
                              active || expanded
                                ? 'border border-primary/40 bg-primary/10 text-primary'
                                : 'border border-transparent text-textMuted hover:bg-white/5 hover:text-text'
                            }`}
                          >
                            <span>{group.label}</span>
                            <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      );
                    })}

                    {directLinks.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`rounded-full px-3 py-2 text-[0.92rem] transition ${
                            active
                              ? 'border border-primary/40 bg-primary/10 text-primary'
                              : 'border border-transparent text-textMuted hover:bg-white/5 hover:text-text'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}

                    {desktopMenu ? (
                      <div className="absolute left-1/2 top-[calc(100%+12px)] z-50 w-[320px] -translate-x-1/2 rounded-[1.45rem] border border-line/80 bg-[rgba(7,14,24,0.98)] p-3 shadow-[0_24px_70px_rgba(2,8,18,0.42)] backdrop-blur-2xl">
                        <div className="space-y-1.5">
                          {navGroups.find((group) => group.key === desktopMenu)?.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`block rounded-[1.05rem] border px-4 py-3 transition ${
                                isItemActive(item.href)
                                  ? 'border-primary/50 bg-primary/10'
                                  : 'border-line bg-[rgba(10,18,30,0.52)] hover:border-primary/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-text">{item.label}</p>
                                <ChevronRight className="h-4 w-4 text-textMuted" />
                              </div>
                              {item.description ? (
                                <p className="mt-1 text-xs leading-relaxed text-textMuted">{item.description}</p>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/carrito" className="chip hover:border-primary/50 hover:text-text">
                    {locale === 'en' ? 'Cart' : t('nav.cart', 'Carrito')}
                  </Link>
                  <Link href={user ? '/perfil' : '/login'} className="button-secondary hidden sm:inline-flex">
                    {user ? t('nav.profile', 'Mi perfil') : t('nav.login', 'Entrar')}
                  </Link>
                  <button
                    type="button"
                    className={`xl:hidden chip min-w-[96px] justify-center ${mobileOpen ? 'border-primary/60 bg-white/5 text-text' : ''}`}
                    onClick={() => setMobileOpen((value) => !value)}
                    aria-expanded={mobileOpen}
                    aria-label="Abrir menú"
                  >
                    {mobileOpen ? 'Cerrar' : 'Menú'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div className="xl:hidden fixed inset-x-0 top-[84px] bottom-0 z-[60] border-t border-line/60 bg-[rgba(4,10,18,0.96)] backdrop-blur-2xl">
            <div className="h-full overflow-y-auto">
              <div className="container py-4">
                <div className="header-rail">
                  <div className="rounded-[1.45rem] border border-line/80 bg-[rgba(7,14,24,0.97)] p-4 shadow-[0_18px_42px_rgba(2,8,18,0.34)]">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={user ? '/perfil' : '/login'}
                        onClick={() => setMobileOpen(false)}
                        className="button-secondary w-full justify-center"
                      >
                        {user ? t('nav.profile', 'Mi perfil') : t('nav.login_mobile', 'Iniciar sesión')}
                      </Link>
                      <Link href="/carrito" onClick={() => setMobileOpen(false)} className="button-primary w-full justify-center">
                        {locale === 'en' ? 'Go to cart' : t('nav.go_cart_mobile', 'Ir al carrito')}
                      </Link>
                    </div>

                    <div className="mt-4 space-y-2">
                      {directLinks.map((item) => (
                        <Link
                          key={`mobile-direct-${item.href}`}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                            isItemActive(item.href)
                              ? 'border-primary/60 bg-primary/10 text-text'
                              : 'border-line bg-[rgba(10,18,30,0.52)] text-text hover:border-primary/30'
                          }`}
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="h-4 w-4 text-textMuted" />
                        </Link>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {navGroups.map((group) => {
                        const open = mobileSections[group.key];
                        return (
                          <div key={`mobile-group-${group.key}`} className="overflow-hidden rounded-[1.25rem] border border-line bg-[rgba(10,18,30,0.52)]">
                            <button
                              type="button"
                              onClick={() =>
                                setMobileSections((current) => ({
                                  ...current,
                                  [group.key]: !current[group.key],
                                }))
                              }
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                              <span className="font-semibold text-text">{group.label}</span>
                              <ChevronDown className={`h-4 w-4 text-textMuted transition ${open ? 'rotate-180' : ''}`} />
                            </button>
                            {open ? (
                              <div className="border-t border-line/70 px-3 py-3">
                                <div className="space-y-2">
                                  {group.items.map((item) => (
                                    <Link
                                      key={`mobile-item-${item.href}`}
                                      href={item.href}
                                      onClick={() => setMobileOpen(false)}
                                      className={`block rounded-2xl border px-4 py-3 transition ${
                                        isItemActive(item.href)
                                          ? 'border-primary/60 bg-primary/10 text-text'
                                          : 'border-line bg-[rgba(10,18,30,0.52)] hover:border-primary/30'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold text-text">{item.label}</p>
                                        <ChevronRight className="h-4 w-4 text-textMuted" />
                                      </div>
                                      {item.description ? (
                                        <p className="mt-1 text-xs leading-relaxed text-textMuted">{item.description}</p>
                                      ) : null}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export default function Navbar() {
  return <NavbarContent />;
}
