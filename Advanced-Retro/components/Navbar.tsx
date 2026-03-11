'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { useLocale } from '@/components/LocaleProvider';

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/tienda', label: t('nav.shop', 'Tienda') },
    { href: '/comunidad', label: t('nav.community', 'Comunidad') },
    { href: '/blog', label: t('nav.blog', 'Blog') },
    { href: '/tienda?category=cajas-misteriosas', label: t('nav.mystery', 'Mystery') },
    { href: '/subastas', label: t('nav.auctions', 'Subastas') },
    { href: '/ruleta', label: t('nav.roulette', 'Ruleta') },
    { href: '/servicio-compra', label: t('nav.concierge', 'Encargos') },
    { href: '/contacto', label: t('nav.contact', 'Contacto') },
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
    for (const [key, value] of targetQuery.entries()) {
      if (searchParams.get(key) !== value) {
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
            className={`lg:hidden chip ${open ? 'border-primary/60 text-text' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Abrir menú"
          >
            {open ? t('nav.close', 'Cerrar') : t('nav.menu', 'Menu')}
          </button>
        </div>
      </div>

      <div className="lg:hidden border-t border-line/80">
        <div className="container py-2">
          <div className="mobile-scroll-row no-scrollbar">
            {navItems.map((item) => {
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={`mobile-quick-${item.href}`}
                  href={item.href}
                  className={`chip shrink-0 ${isActive ? 'text-primary border-primary' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href={user ? '/perfil' : '/login'} className="chip shrink-0">
              {user ? t('nav.profile', 'Mi perfil') : t('nav.login_mobile', 'Iniciar sesión')}
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[70] bg-[rgba(2,8,16,0.72)] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 border-t border-line bg-[rgba(7,14,24,0.98)] rounded-t-2xl">
            <div className="container py-4" onClick={(event) => event.stopPropagation()}>
              <div className="glass p-4 space-y-3 text-sm">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-line/70 mb-1" />
                {navItems.map((item) => (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-transparent px-3 py-2.5 text-textMuted hover:border-line hover:bg-white/5 hover:text-text"
                  >
                    {item.label}
                  </Link>
                ))}

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
