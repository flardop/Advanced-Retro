'use client';

import RetrovilleStudioExperience from '@/components/retroville/RetrovilleStudioExperience';
import type { RetrovilleAudienceSummary } from '@/app/retroville/shared';

type RetrovilleStudioEntryProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  audienceSummary: RetrovilleAudienceSummary;
  initialMobileExperience?: boolean;
};

export default function RetrovilleStudioEntry({
  launchIso,
  launchLabel,
  waitlistCount,
  audienceSummary,
  initialMobileExperience,
}: RetrovilleStudioEntryProps) {
  return (
    <RetrovilleStudioExperience
      launchIso={launchIso}
      launchLabel={launchLabel}
      waitlistCount={waitlistCount}
      audienceSummary={audienceSummary}
      initialMobileExperience={initialMobileExperience}
    />
  );
}
