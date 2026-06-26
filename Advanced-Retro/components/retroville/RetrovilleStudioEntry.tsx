'use client';

import RetrovilleStudioExperience from '@/components/retroville/RetrovilleStudioExperience';

type RetrovilleStudioEntryProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  initialMobileExperience?: boolean;
};

export default function RetrovilleStudioEntry({
  launchIso,
  launchLabel,
  waitlistCount,
  initialMobileExperience,
}: RetrovilleStudioEntryProps) {
  return (
    <RetrovilleStudioExperience
      launchIso={launchIso}
      launchLabel={launchLabel}
      waitlistCount={waitlistCount}
      initialMobileExperience={initialMobileExperience}
    />
  );
}
