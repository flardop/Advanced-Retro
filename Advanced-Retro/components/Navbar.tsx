'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { useLocale } from '@/components/LocaleProvider';

function NavbarContent() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/tienda', label: t('nav.shop', 'Tienda'), icon: '🛒', description: 'Catálogo completo' },
    { href: '/comunidad', label: t('nav.community', 'Comunidad'), icon: '👥', description: 'Compra y vende entre usuarios' },
    { href: '/blog', label: t('nav.blog', 'Blog'), icon: '📰', description: 'Guías y noticias retro' },
    { href: '/tienda?category=cajas-misteriosas', label: t('nav.mystery', 'Mystery'), icon: '🎁', description: 'Drops sorpresa y cajas' },
    { href: '/subastas', label: t('nav.auctions', 'Subastas'), icon: '⏳', description: 'Próximos eventos y pujas' },
    { href: '/ruleta', label: t('nav.roulette', 'Ruleta'), icon: '🎯', description: 'Tiradas y premios' },
    { href: '/servicio-compra', label: t('nav.concierge', 'Encargos'), icon: '🧭', description: 'Compra asistida y seguimiento' },
    { href: '/kickstarter', label: 'Kickstarter', icon: '🚀', description: 'Campaña y donaciones' },
    { href: '/contacto', label: t('nav.contact', 'Contacto'), icon: '💬', description: 'Soporte verificado' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);

    if (supabaseClient) {
      supabaseClient.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
      const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
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

  const queryMatches = (queryString: string) => {
    const targetQuery = new URLSearchParams(queryString);
    const currentQuery =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    for (const [key, value] of targetQuery.entries()) {
      if (currentQuery.get(key) !== value) {
        return false;
      }
    }
    return true;
  };

  const isItemActive = (href: string) => {
    const [targetPath, queryString] = href.split('?');
    const pathMatches = pathname === targetPath || pathname.startsWith(`${targetPath}/`);
    if (!pathMatches) return false;

    if (!queryString) {
      // If there is a more specific menu item for the same path (with query params)
      // and it matches the current URL, keep only that specific item active.
      const hasSpecificMatch = navItems.some((item) => {
        const [itemPath, itemQuery] = item.href.split('?');
        if (!itemQuery || itemPath !== targetPath) return false;
        return queryMatches(itemQuery);
      });
      return !hasSpecificMatch;
    }

    return queryMatches(queryString);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all ${
        scrolled
          ? 'border-line bg-[rgba(8,14,25,0.94)] backdrop-blur-xl shadow-[0_10px_28px_rgba(3,10,24,0.34)]'
          : 'border-line/70 bg-[rgba(8,14,25,0.84)] backdrop-blur-lg'
      }`}
    >
      <div className="container flex h-[66px] items-center justify-between gap-3 sm:h-[70px]">
        <Link href="/" className="flex items-center shrink-0 rounded-lg px-1 py-1 hover:bg-white/5">
          <Image
            src="/logo.png"
            alt="Advanced Retro — Juegos y nostalgia retro"
            width={180}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain logo-breath"
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5 text-[0.9rem]">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 transition ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/40'
                    : 'text-textMuted hover:text-text hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/carrito" className="chip hover:border-primary/50 hover:text-text">
            {t('nav.cart', 'Carrito')}
          </Link>
          <Link href={user ? '/perfil' : '/login'} className="button-secondary hidden sm:inline-flex">
            {user ? t('nav.profile', 'Mi perfil') : t('nav.login', 'Entrar')}
          </Link>
          <button
            className={`lg:hidden chip min-w-[94px] justify-center ${open ? 'border-primary/60 text-text' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Abrir menú"
          >
            {open ? t('nav.close', 'Cerrar') : 'Explorar'}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[70] bg-[rgba(2,8,16,0.72)] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 right-0 w-[min(92vw,420px)] border-l border-line bg-[rgba(7,14,24,0.98)]">
            <div className="h-full overflow-auto p-4" onClick={(event) => event.stopPropagation()}>
              <div className="glass p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Navegación móvil</p>
                  <button type="button" className="chip" onClick={() => setOpen(false)}>
                    {t('nav.close', 'Cerrar')}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {navItems.map((item) => {
                    const isActive = isItemActive(item.href);
                    return (
                      <Link
                        key={`mobile-${item.href}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`rounded-xl border px-3 py-3 transition ${
                          isActive
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-line bg-[rgba(10,18,30,0.45)] hover:border-primary/30'
                        }`}
                      >
                        <p className="font-semibold flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </p>
                        <p className="mt-1 text-xs text-textMuted">{item.description}</p>
                      </Link>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <Link
                    href={user ? '/perfil' : '/login'}
                    onClick={() => setOpen(false)}
                    className="button-secondary w-full"
                  >
                    {user ? t('nav.profile', 'Mi perfil') : t('nav.login_mobile', 'Iniciar sesión')}
                  </Link>
                  <Link href="/carrito" onClick={() => setOpen(false)} className="button-primary w-full">
                    {t('nav.go_cart_mobile', 'Ir al carrito')}
                  </Link>
                </div>

                <div className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-3 text-xs text-textMuted">
                  <p><strong className="text-primary">Envío 24-48h:</strong> preparación desde España</p>
                  <p className="mt-1"><strong className="text-primary">Soporte:</strong> ticket y chat comprador ↔ tienda</p>
                </div>

                {user?.email ? <p className="text-xs text-textMuted pt-1">{t('nav.session', 'Sesión')}: {user.email}</p> : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden border-t border-line/60 xl:block">
        <div className="container flex flex-wrap items-center gap-6 py-2 text-[11px] text-textMuted">
          <span>
            <strong className="text-primary">{t('trust.shipping_title', 'Envío 24-48h:')}</strong>{' '}
            {t('trust.shipping_text', 'preparación desde España')}
          </span>
          <span>
            <strong className="text-primary">{t('trust.verify_title', 'Verificación:')}</strong>{' '}
            {t('trust.verify_text', 'piezas revisadas antes de publicar')}
          </span>
          <span>
            <strong className="text-primary">{t('trust.support_title', 'Soporte:')}</strong>{' '}
            {t('trust.support_text', 'ticket y chat comprador ↔ tienda')}
          </span>
        </div>
      </div>
    </header>
  );
}

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-[rgba(8,14,25,0.84)] backdrop-blur-lg">
      <div className="container flex h-[66px] items-center justify-between gap-3 sm:h-[70px]">
        <Link href="/" className="flex items-center shrink-0 rounded-lg px-1 py-1 hover:bg-white/5">
          <Image
            src="/logo.png"
            alt="Advanced Retro — Juegos y nostalgia retro"
            width={180}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain logo-breath"
            priority
          />
        </Link>
        <div className="chip">Cargando menu...</div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarContent />
    </Suspense>
  );
}
