"use client";

import { useState } from "react";
import { OnboardingStepShell } from "./onboarding-step-shell";
import { OnboardingStepActions } from "./onboarding-step-actions";
import { OnboardingStepLabel } from "./onboarding-step-label";
import { OnboardingField } from "./onboarding-field";
import { GoalButtons } from "./goal-buttons";
import { ONBOARDING_STEP_TITLE, ONBOARDING_STEP_DESCRIPTION } from "./onboarding-step-constants";
import { ChoiceChips } from "./choice-chips";

const PRIMARY_GOALS = [
  "Capture more leads",
  "Qualify prospects automatically",
  "Book more meetings",
  "Close deals faster",
  "Support customers",
  "Others",
];

export interface StepIndustryProps {
  onContinue: (data: { industry: string; primaryGoal: string | null }) => void;
  onSkip: () => void;
}

export function StepIndustry({ onContinue, onSkip }: StepIndustryProps) {
  const [industry, setIndustry] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ industry, primaryGoal });
  };

  return (
    <OnboardingStepShell
      title={ONBOARDING_STEP_TITLE}
      description={ONBOARDING_STEP_DESCRIPTION}
      activeStep={2}
      step2
      onSubmit={handleSubmit}
    >
      <OnboardingField
        id="industry"
        label="Industry"
        placeholder="e.g. SaaS, Real Estate, E-commerce"
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        step2
      />

      <div className="space-y-2">
        <OnboardingStepLabel>Primary Goal</OnboardingStepLabel>

        <ChoiceChips options={PRIMARY_GOALS} selected={primaryGoal} onSelect={setPrimaryGoal} />

      </div>

      <OnboardingStepActions onSkip={onSkip} variant="step2" />
    </OnboardingStepShell>
  );
}
