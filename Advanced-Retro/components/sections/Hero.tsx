'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="section relative overflow-hidden pt-8 sm:pt-10">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute inset-0 bg-radial" />
      <div className="container relative grid gap-10 lg:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="chip">Retro verificado</span>
            <span className="chip">Catálogo multiconsola</span>
            <span className="chip">Envío protegido</span>
          </div>
          <h1 className="title-display text-4xl sm:text-5xl lg:text-6xl">
            Tu tienda retro profesional para comprar, completar y coleccionar.
          </h1>
          <p className="text-textMuted mt-4 text-lg">
            Juegos y consolas revisados con detalle real de estado, opciones por componentes
            y atención directa por ticket en cada pedido.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link href="/tienda" className="button-primary text-center">
              Explorar tienda
            </Link>
            <Link href="/comunidad" className="button-secondary text-center">Ver comunidad</Link>
            <Link href="/servicio-compra" className="button-secondary text-center">Encargo 1:1</Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/tienda?category=platform:game-boy" className="chip hover:border-primary/60">
              Game Boy
            </Link>
            <Link href="/tienda?category=platform:game-boy-color" className="chip hover:border-primary/60">
              Game Boy Color
            </Link>
            <Link href="/tienda?category=platform:game-boy-advance" className="chip hover:border-primary/60">
              Game Boy Advance
            </Link>
            <Link href="/tienda?category=cajas-misteriosas" className="chip hover:border-primary/60">
              Mystery Box
            </Link>
            <Link href="/ruleta" className="chip hover:border-primary/60">
              Ruleta
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-primary font-semibold text-lg">24-48h</p>
              <p className="text-textMuted">Preparación de pedidos</p>
            </div>
            <div>
              <p className="text-primary font-semibold text-lg">5★</p>
              <p className="text-textMuted">Experiencia orientada a confianza</p>
            </div>
            <div>
              <p className="text-primary font-semibold text-lg">100%</p>
              <p className="text-textMuted">Catálogo con foto y stock visible</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/tienda" className="glass p-3 hover:shadow-glow transition-shadow">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">Tienda</p>
              <p className="mt-1 font-semibold">Juegos, cajas y consolas</p>
              <p className="text-xs text-textMuted mt-1">Catálogo filtrable con fotos completas y métricas.</p>
            </Link>
            <Link href="/comunidad" className="glass p-3 hover:shadow-glow transition-shadow">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">Comunidad</p>
              <p className="mt-1 font-semibold">Marketplace de usuarios</p>
              <p className="text-xs text-textMuted mt-1">Compra segura con revisión y seguimiento de la tienda.</p>
            </Link>
            <Link href="/ruleta" className="glass p-3 hover:shadow-glow transition-shadow">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">Experiencias</p>
              <p className="mt-1 font-semibold">Ruleta y mystery box</p>
              <p className="text-xs text-textMuted mt-1">Tickets por precio y premios gestionados desde tu perfil.</p>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass p-6 sm:p-8 shadow-deep"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.12em]">
              <span className="text-primary">Colección destacada</span>
              <span className="text-accent">Actualizada</span>
            </div>

            <div className="relative h-72 rounded-2xl border border-line overflow-hidden bg-gradient-to-br from-[#0f1f33] via-[#12243b] to-[#141f31]">
              <Image
                src="/logo.png"
                alt="Advanced Retro colección destacada"
                fill
                className="object-contain p-8 opacity-90"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#09101a] to-transparent p-4">
                <p className="text-sm text-text">Game Boy, GBC, GBA, SNES y GameCube</p>
                <p className="text-xs text-textMuted mt-1">Incluye opciones original / repro y componentes sueltos</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-3 bg-[rgba(12,23,37,0.74)]">
                <p className="text-xs text-textMuted">Compra guiada</p>
                <p className="text-sm mt-1">Ticket verificado comprador ↔ tienda</p>
              </div>
              <div className="rounded-xl border border-line p-3 bg-[rgba(12,23,37,0.74)]">
                <p className="text-xs text-textMuted">Marketplace comunidad</p>
                <p className="text-sm mt-1">Publica y vende con comisión clara</p>
              </div>
            </div>

            <div className="rounded-xl border border-line p-3 bg-[rgba(12,23,37,0.66)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-textMuted">Siguiente paso recomendado</p>
                  <p className="text-sm mt-1">Explora la tienda o abre un encargo si buscas una pieza concreta</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/tienda" className="chip border-primary text-primary">
                    Ir a tienda
                  </Link>
                  <Link href="/servicio-compra" className="chip">
                    Encargo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
