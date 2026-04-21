"use client";

import { OnboardingStepShell } from "./onboarding-step-shell";
import { OnboardingStepActions } from "./onboarding-step-actions";
import { BenefitsList } from "./benefits-list";
import { ONBOARDING } from "@/lib/design-tokens";
import { ImageWrapper } from "../ui";

const BENEFITS = [
  "Auto-add scheduled meetings",
  "Get reminders for follow-ups",
  "Keep CRM and calendar in sync",
];

const TITLE = "Connect your Google Calendar";
const DESCRIPTION =
  "Sync meetings and follow-ups automatically. We'll keep your calendar up to date so nothing slips.";

export interface StepGoogleCalendarProps {
  onConnect: () => void;
  onSkip: () => void;
}

export function StepGoogleCalendar({ onConnect, onSkip }: StepGoogleCalendarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect();
  };

  return (
    <OnboardingStepShell
      title={TITLE}
      description={DESCRIPTION}
      activeStep={3}
      step3
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center py-2 ">
        <ImageWrapper
          src="/svgs/google-calendar.svg"
          alt="Google Calendar"
          width={120}
          height={120}
        />
      </div>

      <BenefitsList items={BENEFITS} />

      <p
        className="text-sm mb-8 "
        style={{ color: ONBOARDING.TEXT_TITLE }}
      >
        You can connect this later from{" "}
        <strong>Settings</strong>
        {" → "}
        <strong>Integrations</strong>
      </p>

      <OnboardingStepActions
        onSkip={onSkip}
        primaryLabel="Connect Google Calendar"
      />
    </OnboardingStepShell>
  );
}
