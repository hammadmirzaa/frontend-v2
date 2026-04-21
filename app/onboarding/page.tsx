"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding";
import { StepWorkspace } from "@/components/onboarding/step-workspace";
import { StepIndustry } from "@/components/onboarding/step-industry";
import { StepGoogleCalendar } from "@/components/onboarding/step-google-calendar";
import { StepOverview } from "@/components/onboarding/step-overview";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const handleWorkspaceContinue = () => setStep(2);
  const handleWorkspaceSkip = () => setStep(2);
  const handleIndustryContinue = () => setStep(3);
  const handleIndustrySkip = () => setStep(3);
  const handleGoogleCalendarConnect = () => setStep(4);
  const handleGoogleCalendarSkip = () => setStep(4);
  const handleGetStarted = () => {
    router.push("/playground");
  };

  return (
    <OnboardingLayout>
      {step === 1 && (
        <StepWorkspace onContinue={handleWorkspaceContinue} onSkip={handleWorkspaceSkip} />
      )}
      {step === 2 && (
        <StepIndustry onContinue={handleIndustryContinue} onSkip={handleIndustrySkip} />
      )}
      {step === 3 && (
        <StepGoogleCalendar
          onConnect={handleGoogleCalendarConnect}
          onSkip={handleGoogleCalendarSkip}
        />
      )}
      {step === 4 && <StepOverview onGetStarted={handleGetStarted} />}
    </OnboardingLayout>
  );
}
