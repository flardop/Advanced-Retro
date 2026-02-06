'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="section relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-radial" />
      <div className="container relative grid gap-10 lg:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="chip">Premium retro e-commerce</span>
            <span className="chip">Colección 2026</span>
            <span className="chip">Envíos protegidos</span>
          </div>
          <h1 className="title-display text-4xl sm:text-5xl lg:text-6xl leading-tight">
            ADVANCED RETRO: piezas icónicas, curación impecable.
          </h1>
          <p className="text-textMuted mt-4 text-lg">
            Un espacio premium para coleccionistas exigentes. Productos verificados,
            estado real y presentación impecable en cada envío.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Link href="/tienda" className="button-primary">Explorar tienda</Link>
            <Link href="/tienda?category=cajas-misteriosas" className="button-secondary">
              Mystery boxes
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-textMuted">
            <div>
              <p className="text-primary font-semibold">+1.2k</p>
              <p>Coleccionistas activos</p>
            </div>
            <div>
              <p className="text-primary font-semibold">48h</p>
              <p>Preparación premium</p>
            </div>
            <div>
              <p className="text-primary font-semibold">4.9/5</p>
              <p>Valoración media</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass p-8 shadow-deep"
        >
          <div className="grid gap-6">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-primary">DROP DESTACADO</span>
              <span className="text-accent">LIMITED</span>
            </div>
            <div className="h-64 rounded-lg bg-gradient-to-br from-[#121625] to-[#1d2337] border border-line shadow-glow" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-textMuted">Game Boy Collector Series</span>
              <span className="text-primary font-semibold">Desde 89€</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
