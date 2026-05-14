'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import UsageSessionTracker from '@/components/UsageSessionTracker';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type NavLeaf = {
  href: string;
  label: string;
  description: string;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavLeaf[];
};

function NavbarContent() {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSections, setMobileSections] = useState<Record<string, boolean>>({
    shop: true,
    universe: false,
    creators: false,
  });
  const [desktopMenu, setDesktopMenu] = useState<string | null>(null);

  const navGroups = useMemo<NavGroup[]>(() => [
    {
      key: 'shop',
      label: t('nav.shop', 'Tienda'),
      items: [
        { href: '/tienda', label: t('nav.catalog', 'Catálogo completo'), description: 'Todo el inventario oficial de la tienda.' },
        { href: '/mystery-boxes', label: t('nav.mystery', 'Mystery Boxes'), description: 'Drops sorpresa y cajas curadas.' },
        { href: '/subastas', label: t('nav.auctions', 'Subastas'), description: 'Lotes, pujas y aperturas programadas.' },
        { href: '/ruleta', label: t('nav.roulette', 'Ruleta'), description: 'Tickets, tiradas y premios.' },
        { href: '/servicio-compra', label: t('nav.concierge', 'Encargos'), description: 'Compra asistida y seguimiento.' },
      ],
    },
    {
      key: 'universe',
      label: 'Universo',
      items: [
        { href: '/retroville', label: 'Retroville', description: 'Universo narrativo original en desarrollo.' },
        { href: '/blog', label: 'Blog', description: 'Guías, criterio de compra y cultura retro.' },
      ],
    },
    {
      key: 'creators',
      label: 'Creadores',
      items: [
        { href: '/memberships', label: 'Planes de membresía', description: 'Niveles y ventajas dentro del ecosistema.' },
        { href: '/crear-tienda', label: 'Crear mi tienda', description: 'Wizard para lanzar tu propio escaparate.' },
        { href: '/tiendas', label: 'Tiendas de la comunidad', description: 'Directorio de tiendas creadas por miembros.' },
      ],
    },
  ], [t]);

  const directLinks: NavLeaf[] = useMemo(() => [
    { href: '/comunidad', label: t('nav.community', 'Comunidad'), description: 'Compra, vende y conversa con otros usuarios.' },
    { href: '/creator', label: 'Creador', description: 'Joel Rivera Rodriguez y su trabajo.' },
  ], [t]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => {
        window.removeEventListener('scroll', onScroll);
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const groupHasActiveItem = (group: NavGroup) => group.items.some((item) => isItemActive(item.href));

  return (
    <>
      <UsageSessionTracker />
      <header
        className={`sticky top-0 z-50 border-b transition-all ${
          scrolled
            ? 'border-line/80 bg-[rgba(8,14,25,0.92)] backdrop-blur-xl shadow-[0_10px_28px_rgba(3,10,24,0.22)]'
            : 'border-line/60 bg-[rgba(8,14,25,0.78)] backdrop-blur-lg'
        }`}
      >
        <div className="container py-2">
          <div className="header-rail">
            <div className="relative rounded-[1.35rem] border border-line/80 bg-[rgba(8,14,25,0.76)] px-3 py-2 sm:px-4">
              <div className="flex min-h-[60px] items-center justify-between gap-3 sm:min-h-[66px]">
                <Link href="/" className="flex shrink-0 items-center rounded-lg px-1 py-1 hover:bg-white/5">
                  <Image
                    src="/logo.png"
                    alt="Advanced Retro — Juegos y nostalgia retro"
                    width={180}
                    height={48}
                    className="h-9 w-auto object-contain logo-breath sm:h-10"
                    priority
                  />
                </Link>

                <div className="hidden xl:flex xl:flex-1 xl:items-center xl:justify-center">
                  <div className="relative flex items-center gap-1.5" onMouseLeave={() => setDesktopMenu(null)}>
                    {navGroups.map((group) => {
                      const active = groupHasActiveItem(group);
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
                      <div className="absolute left-1/2 top-[calc(100%+12px)] z-50 w-[min(920px,calc(100vw-6rem))] -translate-x-1/2 rounded-[1.6rem] border border-line/80 bg-[rgba(7,14,24,0.98)] p-4 shadow-[0_28px_70px_rgba(2,8,18,0.4)] backdrop-blur-2xl">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {navGroups
                            .find((group) => group.key === desktopMenu)
                            ?.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-[1.25rem] border px-4 py-4 transition ${
                                  isItemActive(item.href)
                                    ? 'border-primary/50 bg-primary/10'
                                    : 'border-line bg-[rgba(10,18,30,0.52)] hover:border-primary/30'
                                }`}
                              >
                                <p className="font-semibold text-text">{item.label}</p>
                                <p className="mt-2 text-sm leading-6 text-textMuted">{item.description}</p>
                              </Link>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/carrito" className="chip hover:border-primary/50 hover:text-text">
                    {locale === 'en' ? 'Cart' : t('nav.cart', 'Carrito')}
                  </Link>
                  <Link href={user ? '/perfil' : '/login'} className="button-secondary hidden sm:inline-flex">
                    {user
                      ? locale === 'en'
                        ? 'My profile'
                        : t('nav.profile', 'Mi perfil')
                      : locale === 'en'
                        ? 'Sign in'
                        : t('nav.login', 'Entrar')}
                  </Link>
                  <button
                    type="button"
                    className={`xl:hidden chip min-w-[94px] justify-center ${mobileOpen ? 'border-primary/60 text-text bg-white/5' : ''}`}
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
          <div className="xl:hidden border-t border-line/60 bg-[rgba(7,14,24,0.98)] backdrop-blur-2xl">
            <div className="container pb-3 pt-2">
              <div className="header-rail">
                <div className="rounded-[1.45rem] border border-line/80 bg-[rgba(7,14,24,0.97)] p-3 shadow-[0_18px_42px_rgba(2,8,18,0.34)]">
                  <div className="space-y-2">
                    {directLinks.map((item) => (
                      <Link
                        key={`mobile-direct-${item.href}`}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-2xl border px-4 py-3 transition ${
                          isItemActive(item.href)
                            ? 'border-primary/60 bg-primary/10 text-text'
                            : 'border-line bg-[rgba(10,18,30,0.52)] hover:border-primary/30'
                        }`}
                      >
                        <p className="font-semibold text-text">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-textMuted">{item.description}</p>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    {navGroups.map((group) => {
                      const open = mobileSections[group.key];
                      return (
                        <div key={`mobile-group-${group.key}`} className="rounded-[1.25rem] border border-line bg-[rgba(10,18,30,0.52)]">
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
                            <div>
                              <p className="font-semibold text-text">{group.label}</p>
                              <p className="mt-1 text-xs text-textMuted">{group.items.length} accesos</p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-textMuted transition ${open ? 'rotate-180' : ''}`} />
                          </button>
                          {open ? (
                            <div className="space-y-2 border-t border-line/70 px-3 py-3">
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
                                  <p className="font-semibold text-text">{item.label}</p>
                                  <p className="mt-1 text-xs leading-relaxed text-textMuted">{item.description}</p>
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link
                      href={user ? '/perfil' : '/login'}
                      onClick={() => setMobileOpen(false)}
                      className="button-secondary w-full justify-center"
                    >
                      {user
                        ? locale === 'en'
                          ? 'My profile'
                          : t('nav.profile', 'Mi perfil')
                        : locale === 'en'
                          ? 'Sign in'
                          : t('nav.login_mobile', 'Iniciar sesión')}
                    </Link>
                    <Link href="/carrito" onClick={() => setMobileOpen(false)} className="button-primary w-full justify-center">
                      {locale === 'en' ? 'Go to cart' : t('nav.go_cart_mobile', 'Ir al carrito')}
                    </Link>
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
