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
    const widthMedia = window.matchMedia('(max-width: 1023px)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setUseMobileExperience(widthMedia.matches || reducedMotionMedia.matches);
    sync();
    widthMedia.addEventListener('change', sync);
    reducedMotionMedia.addEventListener('change', sync);
    return () => {
      widthMedia.removeEventListener('change', sync);
      reducedMotionMedia.removeEventListener('change', sync);
    };
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
