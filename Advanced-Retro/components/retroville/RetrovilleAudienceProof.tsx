import Image from 'next/image';
import RetrovilleEventSignupCard from '@/components/retroville/RetrovilleEventSignupCard';
import {
  RETROVILLE_NEWSLETTER_NAME,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';

type AudienceProfile = {
  name: string;
  role: string;
  image: string;
  accent: string;
};

const audienceProfiles: readonly AudienceProfile[] = [
  {
    name: 'Lucía',
    role: 'Personajes potentes y estética con firma propia',
    image: '/images/retroville/community-avatars/lucia-avatar.png',
    accent: 'from-pink-500/25 via-fuchsia-500/15 to-transparent',
  },
  {
    name: 'Rubén',
    role: 'Lore, worldbuilding y barrios con identidad',
    image: '/images/retroville/community-avatars/ruben-avatar.png',
    accent: 'from-violet-500/25 via-indigo-500/15 to-transparent',
  },
  {
    name: 'Mara',
    role: 'Eventos, drops y comunidad que quiere estar dentro pronto',
    image: '/images/retroville/community-avatars/mara-avatar.png',
    accent: 'from-amber-500/25 via-orange-500/15 to-transparent',
  },
  {
    name: 'Dani',
    role: 'Coleccionismo, humor raro y cultura retro compartida',
    image: '/images/retroville/community-avatars/dani-avatar.png',
    accent: 'from-cyan-500/25 via-sky-500/15 to-transparent',
  },
] as const;

export default function RetrovilleAudienceProof({
  waitlistCount,
  launchIso,
  launchLabel,
}: {
  waitlistCount: number;
  launchIso: string;
  launchLabel: string;
}) {
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);

  return (
    <div className="mt-7 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex -space-x-3">
          {audienceProfiles.map((profile, index) => {
            return (
              <div
                key={profile.name}
                className="relative h-14 w-14 overflow-hidden rounded-full border border-white/14 bg-[rgba(8,11,20,0.94)] shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
                style={{ zIndex: audienceProfiles.length - index }}
              >
                <Image
                  src={profile.image}
                  alt={`Avatar de ${profile.name}, perfil tipo de audiencia de Retroville`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>
        <div className="max-w-[34rem] text-left">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Pulso de comunidad</p>
          <p className="mt-2 text-sm leading-7 text-[var(--rv-text-muted)]">
            {showAudienceCount
              ? `${waitlistCount.toLocaleString('es-ES')} personas ya siguen ${RETROVILLE_NEWSLETTER_NAME}. Los avatares que ves aquí no salen de ninguna base real: son perfiles tipo creados para representar la comunidad que mejor encaja con Retroville.`
              : `Aunque ${RETROVILLE_NEWSLETTER_NAME} acaba de arrancar, Retroville ya tiene una audiencia muy clara. Los perfiles que ves aquí son avatares creados para el proyecto, no usuarios heredados de otra web.`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {audienceProfiles.map((profile) => {
          return (
            <article
              key={profile.name}
              className="relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(10,14,24,0.8)] p-4"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${profile.accent}`} />
              <div className="relative flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/40">
                  <Image
                    src={profile.image}
                    alt={`Avatar de ${profile.name}, ejemplo de comunidad que conecta con Retroville`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white">{profile.name}</p>
                  <p className="text-xs text-[var(--rv-text-muted)]">{profile.role}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <RetrovilleEventSignupCard launchIso={launchIso} launchLabel={launchLabel} />
    </div>
  );
}
