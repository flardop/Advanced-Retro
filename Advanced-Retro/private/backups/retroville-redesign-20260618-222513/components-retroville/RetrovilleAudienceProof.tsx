import Image from 'next/image';
import RetrovilleEventSignupCard from '@/components/retroville/RetrovilleEventSignupCard';
import {
  RETROVILLE_NEWSLETTER_NAME,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';

const communityPhotoPool = [
  '/images/community/homemade/community-photo-001.jpeg',
  '/images/community/homemade/community-photo-006.jpeg',
  '/images/community/homemade/community-photo-011.jpeg',
  '/images/community/homemade/community-photo-015.jpeg',
  '/images/community/homemade/community-photo-020.jpeg',
  '/images/community/homemade/community-photo-024.jpeg',
  '/images/community/homemade/community-photo-029.jpeg',
  '/images/community/homemade/community-photo-033.jpeg',
] as const;

type AudienceProfile = {
  name: string;
  role: string;
  photoOffset: number;
  accent: string;
  useInitialOnly?: boolean;
};

const audienceProfiles: readonly AudienceProfile[] = [
  {
    name: 'Lucía',
    role: 'Personajes potentes y estética con firma propia',
    photoOffset: 0,
    accent: 'from-pink-500/25 via-fuchsia-500/15 to-transparent',
  },
  {
    name: 'Rubén',
    role: 'Lore, worldbuilding y barrios con identidad',
    photoOffset: 3,
    accent: 'from-violet-500/25 via-indigo-500/15 to-transparent',
  },
  {
    name: 'Mara',
    role: 'Eventos, drops y comunidad que quiere estar dentro pronto',
    photoOffset: 5,
    useInitialOnly: true,
    accent: 'from-amber-500/25 via-orange-500/15 to-transparent',
  },
  {
    name: 'Dani',
    role: 'Coleccionismo, humor raro y cultura retro compartida',
    photoOffset: 7,
    accent: 'from-cyan-500/25 via-sky-500/15 to-transparent',
  },
] as const;

function getInitials(name: string) {
  const safe = String(name || '').trim();
  if (!safe) return 'RV';
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function resolvePhoto(photoOffset: number, waitlistCount: number) {
  return communityPhotoPool[(Math.max(0, waitlistCount) + photoOffset) % communityPhotoPool.length];
}

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
            const photo = profile.useInitialOnly ? null : resolvePhoto(profile.photoOffset, waitlistCount);

            return (
              <div
                key={profile.name}
                className="relative h-14 w-14 overflow-hidden rounded-full border border-white/14 bg-[rgba(8,11,20,0.94)] shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
                style={{ zIndex: audienceProfiles.length - index }}
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt={`Avatar de ${profile.name}, perfil tipo de audiencia de Retroville`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(250,204,21,0.24),rgba(249,115,22,0.34))] text-sm font-semibold uppercase tracking-[0.14em] text-white">
                    {getInitials(profile.name)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="max-w-[34rem] text-left">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Pulso de comunidad</p>
          <p className="mt-2 text-sm leading-7 text-[var(--rv-text-muted)]">
            {showAudienceCount
              ? `${waitlistCount.toLocaleString('es-ES')} personas ya siguen ${RETROVILLE_NEWSLETTER_NAME}. Este es el tipo de comunidad que mejor conecta con Retroville: personajes fuertes, lore, barrio, drops y ganas de estar en el primer reveal.`
              : `Aunque ${RETROVILLE_NEWSLETTER_NAME} acaba de arrancar, Retroville ya está pensado para atraer a una mezcla muy clara: fans del worldbuilding, personajes potentes, estética de serie, humor raro y eventos con identidad.`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {audienceProfiles.map((profile) => {
          const photo = profile.useInitialOnly ? null : resolvePhoto(profile.photoOffset, waitlistCount);

          return (
            <article
              key={profile.name}
              className="relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(10,14,24,0.8)] p-4"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${profile.accent}`} />
              <div className="relative flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/40">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={`Avatar de ${profile.name}, ejemplo de comunidad que conecta con Retroville`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(250,204,21,0.24),rgba(249,115,22,0.34))] text-sm font-semibold uppercase tracking-[0.14em] text-white">
                      {getInitials(profile.name)}
                    </div>
                  )}
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
