"use client";

import { ONBOARDING } from "@/lib/design-tokens";

export interface OnboardingStepLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label for section headings (e.g. "Your Role", "Primary Goal"). Styling from step-workspace.
 */
export function OnboardingStepLabel({
  htmlFor,
  children,
  className = "",
}: OnboardingStepLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium ${className}`.trim()}
      style={{ color: ONBOARDING.TEXT_TITLE }}
    >
      {children}
    </label>
  );
}
