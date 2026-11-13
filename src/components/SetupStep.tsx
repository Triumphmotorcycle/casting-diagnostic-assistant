import { useState } from "react";
import { CastingCase } from "@/types/casting";
import { Button } from "@/components/ui/button";
import { LegacySetupStep } from "@/components/LegacySetupStep";
import { ReworkedSetupStep } from "@/components/ReworkedSetupStep";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
  onNext: () => void;
}

export function SetupStep(props: Props) {
  const [useExistingIntake, setUseExistingIntake] = useState(false);

  if (useExistingIntake) {
    return <LegacySetupStep {...props} onSwitchToReworked={() => setUseExistingIntake(false)} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-amber-950">Reworked technical intake</p>
          <p className="mt-0.5 text-xs text-amber-900/80">The previous intake remains available as a fallback while this version is evaluated.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setUseExistingIntake(true)}>Use existing intake</Button>
      </div>
      <ReworkedSetupStep {...props} />
    </div>
  );
}
