'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

const NAV_ITEMS = [
  { href: '/tienda', label: 'Tienda' },
  { href: '/comunidad', label: 'Comunidad' },
  { href: '/tienda?category=cajas-misteriosas', label: 'Mystery' },
  { href: '/ruleta', label: 'Ruleta' },
  { href: '/servicio-compra', label: 'Encargos' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all ${
        scrolled
          ? 'border-line bg-[rgba(8,15,26,0.9)] backdrop-blur-xl shadow-[0_12px_30px_rgba(3,10,24,0.32)]'
          : 'border-line/70 bg-[rgba(8,15,26,0.74)] backdrop-blur-lg'
      }`}
    >
      <div className="container h-[72px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0 rounded-lg px-1 py-1 hover:bg-white/5">
          <Image
            src="/logo.png"
            alt="Advanced Retro — Juegos y nostalgia retro"
            width={180}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-[0.95rem]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`link-underline ${isActive ? 'text-primary' : 'text-textMuted hover:text-text'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/carrito" className="chip hover:border-primary/50 hover:text-text">
            Carrito
          </Link>
          <Link href={user ? '/perfil' : '/login'} className="button-secondary hidden sm:inline-flex">
            {user ? 'Mi perfil' : 'Entrar'}
          </Link>
          <button
            className={`lg:hidden chip ${open ? 'border-primary/60 text-text' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Abrir menú"
          >
            {open ? 'Cerrar' : 'Menu'}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-line">
          <div className="container py-4">
            <div className="glass p-4 space-y-3 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg border border-transparent px-3 py-2 text-textMuted hover:border-line hover:bg-white/5 hover:text-text"
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
                  {user ? 'Mi perfil' : 'Iniciar sesión'}
                </Link>
                <Link href="/carrito" onClick={() => setOpen(false)} className="button-primary w-full">
                  Ir al carrito
                </Link>
              </div>

              {user?.email ? (
                <p className="text-xs text-textMuted pt-1">Sesión: {user.email}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-line/60 hidden lg:block">
        <div className="container py-2 text-[11px] text-textMuted flex flex-wrap items-center gap-6">
          <span>
            <strong className="text-primary">Envío 24-48h:</strong> preparación desde España
          </span>
          <span>
            <strong className="text-primary">Verificación:</strong> piezas revisadas antes de publicar
          </span>
          <span>
            <strong className="text-primary">Soporte:</strong> ticket y chat comprador ↔ tienda
          </span>
        </div>
      </div>
    </header>
  );
}
