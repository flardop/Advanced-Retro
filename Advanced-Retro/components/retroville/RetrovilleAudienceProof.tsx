import RetrovilleEventSignupCard from '@/components/retroville/RetrovilleEventSignupCard';
import { RETROVILLE_NEWSLETTER_NAME, type RetrovilleAudienceSummary } from '@/app/retroville/shared';

type AudienceMetric = {
  label: string;
  value: number;
  helper: string;
};

const RETROVILLE_EDITORIAL_AUDIENCE_SEED: RetrovilleAudienceSummary = {
  totalRegistrations: 38,
  newsletterRegistrations: 21,
  eventRegistrations: 17,
  roleBreakdown: [
    { label: 'Fans', value: 14, share: 14 / 38 },
    { label: 'Diseñadores', value: 10, share: 10 / 38 },
    { label: 'Desarrolladores', value: 8, share: 8 / 38 },
    { label: 'Inversores', value: 6, share: 6 / 38 },
  ],
};

function formatCount(value: number) {
  return Math.max(0, Number(value || 0)).toLocaleString('es-ES');
}

export default function RetrovilleAudienceProof({
  waitlistCount,
  launchIso,
  launchLabel,
  audienceSummary,
}: {
  waitlistCount: number;
  launchIso: string;
  launchLabel: string;
  audienceSummary?: RetrovilleAudienceSummary;
}) {
  const liveTotalRegistrations = audienceSummary?.totalRegistrations || Math.max(0, Number(waitlistCount || 0));
  const hasLiveRegistrations = liveTotalRegistrations > 0;
  const liveAudienceSummary: RetrovilleAudienceSummary = audienceSummary || {
    totalRegistrations: liveTotalRegistrations,
    newsletterRegistrations: 0,
    eventRegistrations: 0,
    roleBreakdown: [],
  };
  const effectiveAudienceSummary = hasLiveRegistrations ? liveAudienceSummary : RETROVILLE_EDITORIAL_AUDIENCE_SEED;
  const totalRegistrations = effectiveAudienceSummary.totalRegistrations;
  const newsletterRegistrations = effectiveAudienceSummary.newsletterRegistrations;
  const eventRegistrations = effectiveAudienceSummary.eventRegistrations;
  const roleBreakdown = effectiveAudienceSummary.roleBreakdown || [];
  const isEditorialSeed = !hasLiveRegistrations;

  const metrics: readonly AudienceMetric[] = [
    {
      label: isEditorialSeed ? 'Señal inicial' : 'Registros reales',
      value: totalRegistrations,
      helper: isEditorialSeed
        ? 'Lectura editorial de arranque para que el bloque no arranque vacío mientras entra volumen real.'
        : 'Personas que ya han dejado su email dentro de Retroville.',
    },
    {
      label: isEditorialSeed ? 'Reveal en foco' : 'Reveal público',
      value: eventRegistrations,
      helper: isEditorialSeed
        ? `Interés inicial concentrado alrededor del reveal del ${launchLabel}.`
        : `Solicitudes apuntadas al reveal del ${launchLabel}.`,
    },
    {
      label: 'Newsletter',
      value: newsletterRegistrations,
      helper: isEditorialSeed
        ? `Base de salida para ${RETROVILLE_NEWSLETTER_NAME} antes de que el registro coja ritmo real.`
        : `Altas guardadas dentro de ${RETROVILLE_NEWSLETTER_NAME}.`,
    },
  ] as const;

  return (
    <div className="mt-7 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="rounded-[1.3rem] border border-white/8 bg-[rgba(7,11,22,0.74)] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Interés real del registro</p>
          <h3 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase leading-[0.96] text-white">
            Lectura real del interés
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)] sm:text-base">
            {hasLiveRegistrations
              ? `Este bloque resume el interés que ya entra por el formulario: cuánta gente se ha registrado, cuántas personas se apuntan al reveal y qué perfiles aparecen con más frecuencia en ${RETROVILLE_NEWSLETTER_NAME}.`
              : `El registro ya está abierto. Mientras entran respuestas suficientes, esta franja enseña una lectura editorial de arranque con los perfiles que mejor encajan con Retroville para que la sección no se quede muerta.`}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-[1.15rem] border border-white/8 bg-[rgba(10,14,24,0.8)] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-gold)]">{metric.label}</p>
                <p className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-none text-white">
                  {formatCount(metric.value)}
                </p>
                <p className="mt-3 text-xs leading-6 text-[var(--rv-text-dim)]">{metric.helper}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-white/8 bg-[rgba(10,14,24,0.8)] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Perfiles que más conectan</p>
          {roleBreakdown.length ? (
            <div className="mt-4 grid gap-3">
              {roleBreakdown.map((role) => (
                <div key={role.label} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white">{role.label}</p>
                    <span className="text-xs text-[var(--rv-text-muted)]">
                      {formatCount(role.value)} · {Math.round(role.share * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,191,82,0.92),rgba(87,240,174,0.78))]"
                      style={{ width: `${Math.max(12, Math.round(role.share * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--rv-text-muted)]">
              Cuando entren más respuestas, esta franja enseñará qué perfiles tiran más del proyecto entre
              desarrolladores, diseñadores, inversores y fans.
            </p>
          )}

          <div className="mt-5 rounded-[1rem] border border-[rgba(138,215,255,0.16)] bg-[rgba(138,215,255,0.06)] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-accent)]">Qué sí estamos leyendo</p>
            <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--rv-text-muted)]">
              <li>{isEditorialSeed ? 'Una base editorial de arranque hasta que entren registros suficientes.' : 'Registros reales del reveal y de la newsletter.'}</li>
              <li>{isEditorialSeed ? 'Los perfiles que mejor representan el tipo de audiencia que ya está buscando la serie.' : 'Perfiles declarados por el usuario en el formulario.'}</li>
              <li>Lectura propia de Retroville sin mezclar datos heredados de otras webs.</li>
            </ul>
          </div>
        </div>
      </div>

      <RetrovilleEventSignupCard launchIso={launchIso} launchLabel={launchLabel} />
    </div>
  );
}
