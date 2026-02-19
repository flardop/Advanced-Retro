'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function Navbar() {
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
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 ${scrolled ? 'bg-[#0b0c10]/90 backdrop-blur border-b border-line' : ''}`}>
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Advanced Retro — Juegos y nostalgia retro"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-textMuted">
          <Link href="/tienda">Tienda</Link>
          <Link href="/tienda?category=cajas-misteriosas">Mystery</Link>
          <Link href="/ruleta">Ruleta</Link>
          <Link href="/servicio-compra">Encargos</Link>
          <Link href="/contacto">Contacto</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/carrito" className="chip">Carrito</Link>
          <Link href={user ? '/perfil' : '/login'} className="chip">
            {user ? 'Perfil' : 'Ingresar'}
          </Link>
          <button className="md:hidden chip" onClick={() => setOpen(!open)}>
            Menu
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-line">
          <div className="container py-3 flex flex-col gap-2 text-sm text-textMuted">
            <Link href="/tienda" onClick={() => setOpen(false)}>Tienda</Link>
            <Link href="/tienda?category=cajas-misteriosas" onClick={() => setOpen(false)}>Mystery</Link>
            <Link href="/ruleta" onClick={() => setOpen(false)}>Ruleta</Link>
            <Link href="/servicio-compra" onClick={() => setOpen(false)}>Encargos</Link>
            <Link href="/contacto" onClick={() => setOpen(false)}>Contacto</Link>
          </div>
        </div>
      )}
      <div className="border-t border-line/60 hidden md:block">
        <div className="container py-2 text-xs text-textMuted flex flex-wrap items-center gap-6">
          <span><strong className="text-primary">Mystery:</strong> compras tirada</span>
          <span><strong className="text-primary">Ruleta:</strong> giras y ganas premio</span>
          <span><strong className="text-primary">Encargos:</strong> compra asistida 1 a 1</span>
        </div>
      </div>
    </header>
  );
}
