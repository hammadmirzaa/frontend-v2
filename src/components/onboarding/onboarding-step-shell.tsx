"use client";

import { ReactNode } from "react";
import { OnboardingCard, OnboardingCardHeader, OnboardingCardContent } from "./onboarding-card";
import { ProgressSteps } from "./progress-steps";
import { COLORS, ONBOARDING } from "@/lib/design-tokens";

export interface OnboardingStepShellProps {
  title: string;
  description: string;
  activeStep: number;
  step2?: boolean;
  step3?: boolean;
  step4?: boolean;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Shared shell for onboarding steps: card, header (title + description + progress), form wrapper.
 * Progress bars use BRAND color for active steps.
 */
export function OnboardingStepShell({
  title,
  description,
  activeStep,
  step2 = false,
  step3 = false,
  step4 = false,
  children,
  onSubmit,
}: OnboardingStepShellProps) {
  return (
    <OnboardingCard step2={step2} step3={step3} step4={step4}>
      <OnboardingCardHeader>
        <h2
          className="text-2xl sm:text-3xl my-2 font-bold text-center"
          style={{ color: ONBOARDING.TEXT_TITLE }}
        >
          {title}
        </h2>
        <p
          className="text-sm text-center max-w-md mx-auto"
          style={{ color: COLORS.GRAY_400 }}
        >
          {description}
        </p>
        <div className="flex justify-center pt-1">
          <ProgressSteps activeStep={activeStep} />
        </div>
      </OnboardingCardHeader>

      <form onSubmit={onSubmit}>
        <OnboardingCardContent>{children}</OnboardingCardContent>
      </form>
    </OnboardingCard>
  );
}
