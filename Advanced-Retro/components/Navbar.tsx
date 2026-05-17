'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const desktopMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const mobileLinks = useMemo<NavLeaf[]>(
    () => [
      { href: '/tienda', label: 'Tienda' },
      { href: '/mystery-boxes', label: 'Mystery Boxes' },
      { href: '/subastas', label: 'Subastas' },
      { href: '/ruleta', label: 'Ruleta' },
      { href: '/comunidad', label: 'Comunidad' },
      { href: '/blog', label: 'Blog' },
      { href: '/retroville', label: 'Retroville' },
      { href: '/creator', label: 'Creador' },
      { href: '/contacto', label: 'Contacto' },
    ],
    []
  );

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
    return () => {
      if (desktopMenuCloseTimer.current) {
        clearTimeout(desktopMenuCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const groupIsActive = (group: NavGroup) => group.items.some((item) => isItemActive(item.href));

  const clearDesktopMenuCloseTimer = () => {
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
      desktopMenuCloseTimer.current = null;
    }
  };

  const openDesktopMenu = (key: string) => {
    clearDesktopMenuCloseTimer();
    setDesktopMenu(key);
  };

  const scheduleDesktopMenuClose = () => {
    clearDesktopMenuCloseTimer();
    desktopMenuCloseTimer.current = setTimeout(() => {
      setDesktopMenu(null);
      desktopMenuCloseTimer.current = null;
    }, 180);
  };

  return (
    <>
      <UsageSessionTracker />
      <header
        className={`z-header sticky top-0 border-b transition-all ${
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
                  <div
                    className="relative flex items-center gap-1.5"
                    onMouseEnter={clearDesktopMenuCloseTimer}
                    onMouseLeave={scheduleDesktopMenuClose}
                  >
                    {navGroups.map((group) => {
                      const active = groupIsActive(group);
                      const expanded = desktopMenu === group.key;
                      return (
                        <div key={group.key} className="relative pb-4">
                          <button
                            type="button"
                            onMouseEnter={() => openDesktopMenu(group.key)}
                            onFocus={() => openDesktopMenu(group.key)}
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
                      <div
                        className="z-dropdown absolute left-1/2 top-full w-[344px] -translate-x-1/2 pt-3"
                        onMouseEnter={clearDesktopMenuCloseTimer}
                        onMouseLeave={scheduleDesktopMenuClose}
                      >
                        <div className="rounded-[1.45rem] border border-line/80 bg-[rgba(7,14,24,0.98)] p-3 shadow-[0_24px_70px_rgba(2,8,18,0.42)] backdrop-blur-2xl">
                          <div className="space-y-1.5">
                            {navGroups.find((group) => group.key === desktopMenu)?.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onFocus={clearDesktopMenuCloseTimer}
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
          <div className="z-mobile-menu fixed inset-0 xl:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
            <div
              className="absolute inset-0 bg-[rgba(0,0,0,0.72)] backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <nav className="relative z-[1] flex h-[100dvh] w-full animate-[menuSlideIn_250ms_ease_forwards] flex-col overflow-y-auto bg-[#0a0a0f]">
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="AdvancedRetro"
                    width={160}
                    height={44}
                    className="h-9 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-lg text-white transition hover:bg-white/15"
                  aria-label="Cerrar menú"
                >
                  ✕
                </button>
              </div>

              <ul className="flex flex-1 flex-col gap-1 px-6 py-6">
                {mobileLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-[52px] items-center rounded-xl px-4 py-3 text-[1.25rem] font-medium tracking-[-0.02em] transition ${
                        isItemActive(item.href)
                          ? 'bg-white/8 text-white'
                          : 'text-white/84 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-4">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/carrito"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[48px] items-center justify-center rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-base font-semibold text-white transition hover:opacity-80"
                  >
                    {locale === 'en' ? 'Cart' : 'Carrito'}
                  </Link>
                  <Link
                    href={user ? '/perfil' : '/login'}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-[#08263d] transition hover:opacity-90"
                  >
                    {user ? t('nav.profile', 'Mi perfil') : t('nav.login', 'Entrar')}
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}

export default function Navbar() {
  return <NavbarContent />;
}
