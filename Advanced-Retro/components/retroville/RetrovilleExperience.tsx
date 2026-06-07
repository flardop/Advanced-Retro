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
    // Tablets and touch-first mid-size devices read better in the mobile flow
    // than in the full-screen desktop slide experience.
    const media = window.matchMedia(
      '(max-width: 1023px), ((max-width: 1366px) and (pointer: coarse)), ((max-width: 1366px) and (hover: none)), (prefers-reduced-motion: reduce)'
    );
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
