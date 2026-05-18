'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function HomeNarrative() {
  const { t } = useLocale();

  return (
    <section className="section pt-0">
      <div className="container">
        <div className="content-rail glass grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.92fr,1.08fr]">
          <div className="min-w-0">
            <p className="section-kicker">Advanced Retro</p>
            <h2 className="title-display mobile-safe-wrap mt-3 text-2xl sm:text-3xl">{t('home.narrative.title', 'Tienda retro para coleccionistas y jugadores')}</h2>
          </div>
          <div className="min-w-0 space-y-4">
            <p className="mobile-safe-wrap text-textMuted leading-relaxed">
              {t(
                'home.narrative.p1',
                'En Advanced Retro encontrarás catálogo especializado de videojuegos retro con foco en Game Boy, Game Boy Color, Game Boy Advance, Super Nintendo y GameCube. Cada ficha de producto está pensada para compra clara: estado, fotos, componentes y precio.'
              )}
            </p>
            <p className="mobile-safe-wrap text-textMuted leading-relaxed">
              {t(
                'home.narrative.p2',
                'Si buscas una pieza concreta, también puedes usar nuestro servicio de encargo con soporte por ticket para comparar opciones, validar estado y seguir el pedido hasta la entrega.'
              )}
            </p>
            <p className="mobile-safe-wrap text-textMuted leading-relaxed">
              {t(
                'home.narrative.p3',
                'Advanced Retro está orientada a compra con contexto real: catálogo limpio, filtros por consola, fichas de producto con componentes y navegación diseñada para que encuentres más rápido tanto juegos completos como piezas sueltas para completar colección.'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
