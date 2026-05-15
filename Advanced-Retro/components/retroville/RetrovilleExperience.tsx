'use client';

import { useEffect, useState } from 'react';
import RetrovilleExperienceMobile from '@/components/retroville/RetrovilleExperienceMobile';

import RetrovilleDesktopExperience from '@/components/retroville/RetrovilleDesktopExperience';

type RetrovilleExperienceProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  initialMobileExperience?: boolean;
};

export default function RetrovilleExperience({
  launchIso,
  launchLabel,
  waitlistCount,
  initialMobileExperience = false,
}: RetrovilleExperienceProps) {
  const [useMobileExperience, setUseMobileExperience] = useState(initialMobileExperience);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px), (prefers-reduced-motion: reduce)');
    const sync = () => setUseMobileExperience(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (useMobileExperience) {
    return (
      <RetrovilleExperienceMobile
        launchIso={launchIso}
        launchLabel={launchLabel}
        waitlistCount={waitlistCount}
      />
    );
  }

  return (
    <RetrovilleDesktopExperience
      launchIso={launchIso}
      launchLabel={launchLabel}
      waitlistCount={waitlistCount}
    />
  );
}
