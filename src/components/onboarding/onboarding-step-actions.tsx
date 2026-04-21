"use client";

import { Button } from "@/components/ui";
import { COLORS, ONBOARDING } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const BUTTON_CLASS =
  "w-full rounded-lg py-3 text-sm font-medium";

export interface OnboardingStepActionsProps {
  onSkip?: () => void;
  variant?: "step1" | "step2";
  primaryLabel?: string;
  showSkip?: boolean;
}

export function OnboardingStepActions({
  onSkip,
  variant = "step1",
  primaryLabel = "Continue",
  showSkip = true,
}: OnboardingStepActionsProps) {
  const primaryBg =
    variant === "step2" ? ONBOARDING.BUTTON_PRIMARY_STEP2 : COLORS.BRAND;
  const skipBg =
    variant === "step2" ? ONBOARDING.BUTTON_SKIP_STEP2_BG : ONBOARDING.BUTTON_SKIP_BG;
  const skipColor = variant === "step2" ? ONBOARDING.TEXT_MUTED : COLORS.BLACK;

  return (
    <div className="space-y-3 pt-2">
      <Button
        type="submit"
        className={cn(BUTTON_CLASS)}
        style={{
          backgroundColor: COLORS.BRAND,
          color: ONBOARDING.WHITE,
        }}
      >
        {primaryLabel}
      </Button>
      {showSkip && (
        <Button
          type="button"
          onClick={onSkip}
          className={cn(BUTTON_CLASS)}
          style={{
            backgroundColor: skipBg,
            color: skipColor,
          }}
        >
          Skip for now
        </Button>
      )}
    </div>
  );
}
