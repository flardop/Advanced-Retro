'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function Benefits() {
  const { t } = useLocale();

  const benefits = [
    {
      badge: '01',
      title: t('home.benefits.card_01.title', 'Inspección antes de publicar'),
      text: t(
        'home.benefits.card_01.text',
        'Cada artículo entra con estado real, fotos claras y estructura de datos consistente para filtrar mejor.'
      ),
    },
    {
      badge: '02',
      title: t('home.benefits.card_02.title', 'Envío preparado para coleccionismo'),
      text: t(
        'home.benefits.card_02.text',
        'Protección de piezas sensibles y trazabilidad de pedido para reducir incidencias en entrega.'
      ),
    },
    {
      badge: '03',
      title: t('home.benefits.card_03.title', 'Soporte humano en todo el flujo'),
      text: t(
        'home.benefits.card_03.text',
        'Tickets privados para compras, encargos y comunidad con respuesta contextual.'
      ),
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div className="section-copy">
            <p className="section-kicker">{t('home.benefits.badge', 'Por qué funciona')}</p>
            <h2 className="title-display mt-3 text-3xl sm:text-4xl">{t('home.benefits.title', 'Confianza medible en cada compra')}</h2>
          </div>
          <span className="chip">{t('home.benefits.chip', 'Flujo pensado para convertir')}</span>
        </div>

        <div className="content-rail grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="glass relative p-6 sm:p-7">
              <span className="absolute right-5 top-5 text-xs font-mono tracking-[0.18em] text-primary/70">{benefit.badge}</span>
              <p className="text-xs font-mono tracking-[0.14em] text-primary">ADVANCED RETRO</p>
              <h3 className="mt-3 text-xl font-semibold text-text">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-textMuted">{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
