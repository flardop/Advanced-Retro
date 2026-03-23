'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function RetroStory() {
  const { t } = useLocale();

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-7 sm:p-9 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">{t('home.story.badge', 'Visión de tienda')}</p>
              <h2 className="title-display mt-3 text-3xl sm:text-4xl">
                {t('home.story.title', 'Menos decoración vacía, más contexto real para comprar retro.')}
              </h2>
              <p className="mt-4 max-w-[66ch] text-textMuted">
                {t(
                  'home.story.description',
                  'Advanced Retro está construida para compra y venta de coleccionismo con claridad: filtros útiles, fichas completas, comunidad moderada y soporte postventa con seguimiento real.'
                )}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-[rgba(10,19,31,0.7)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-textMuted">{t('home.story.commitment', 'Compromiso operativo')}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('home.story.point_01', 'Inventario con stock real y visibilidad de componentes.')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('home.story.point_02', 'Servicio de encargo y validación en ticket privado.')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('home.story.point_03', 'Marketplace comunidad con revisión y trazabilidad.')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
