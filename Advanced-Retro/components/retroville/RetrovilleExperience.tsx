'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RetrovilleStudioExperience from '@/components/retroville/RetrovilleStudioExperience';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';

type RetrovilleExperienceProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  initialMobileExperience?: boolean;
};

function RetrovilleLoadingShell({ launchLabel }: { launchLabel: string }) {
  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[#06070d] text-[#f5efe6]`}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-6 py-20 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-white/58">
          <span>AdvancedRetro original series</span>
          <span className="text-[#d49a43]">{launchLabel}</span>
        </div>

        <div className="max-w-4xl space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#c43a2f]">Entrada cinematográfica</p>
          <h1 className={`${displayFont.className} text-[clamp(3rem,8vw,6.8rem)] uppercase leading-[0.9] text-[#f5efe6]`}>
            RETROVILLE NO SE ABRE.
            <br />
            SE DESCIENDE.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Estamos cargando la experiencia completa de la serie para que entre limpia y sin romper la página.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/retroville/personajes"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(196,58,47,0.38)] bg-[rgba(196,58,47,0.14)] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
          >
            Cast completo
          </Link>
          <Link
            href="/retroville/episodios"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/84"
          >
            Temporada 1
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function RetrovilleExperience({
  launchIso,
  launchLabel,
  waitlistCount,
  initialMobileExperience,
}: RetrovilleExperienceProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <RetrovilleLoadingShell launchLabel={launchLabel} />;
  }

  return (
    <RetrovilleStudioExperience
      launchIso={launchIso}
      launchLabel={launchLabel}
      waitlistCount={waitlistCount}
      initialMobileExperience={initialMobileExperience}
    />
  );
}
