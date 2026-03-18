import type { Metadata } from 'next';
import Link from 'next/link';
import ThreeDBoxPlayground from '@/components/sections/ThreeDBoxPlayground';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Lab 3D de cajas retro | Demo técnica',
  description:
    'Laboratorio técnico de Advanced Retro para probar cajas 3D animadas de juegos retro sin afectar el catálogo principal.',
  path: '/lab/caja-3d',
  noIndex: true,
  keywords: ['demo cajas 3d', 'caja retro 3d', 'advanced retro laboratorio'],
});

export default function Box3DLabPage() {
  return (
    <section className="section">
      <div className="container space-y-6">
        <div className="glass p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Laboratorio visual</p>
          <h1 className="title-display mt-2 text-2xl sm:text-3xl">Demo de caja 3D animada</h1>
          <p className="text-textMuted mt-2 leading-relaxed">
            Este entorno sirve para validar diseño, rendimiento y sensación visual antes de llevar el 3D a las fichas reales de producto.
            Está hecho con CSS 3D + animación ligera, por lo que el coste de rendimiento es bajo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/tienda" className="button-secondary">Volver a tienda</Link>
            <span className="chip">Estado: prueba técnica</span>
          </div>
        </div>

        <ThreeDBoxPlayground />
      </div>
    </section>
  );
}
