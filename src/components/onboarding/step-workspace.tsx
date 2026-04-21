"use client";

import { useState } from "react";
import { OnboardingStepShell } from "./onboarding-step-shell";
import { OnboardingStepActions } from "./onboarding-step-actions";
import { OnboardingStepLabel } from "./onboarding-step-label";
import { OnboardingField } from "./onboarding-field";
import { ChoiceChips } from "./choice-chips";
import { ONBOARDING_STEP_TITLE, ONBOARDING_STEP_DESCRIPTION } from "./onboarding-step-constants";

const ROLES = [
  "Founder / Owner",
  "Sales",
  "Marketing",
  "Product",
  "Other",
];

export interface StepWorkspaceProps {
  onContinue: (data: { workspaceName: string; role: string | null }) => void;
  onSkip: () => void;
}

export function StepWorkspace({ onContinue, onSkip }: StepWorkspaceProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ workspaceName, role });
  };

  return (
    <OnboardingStepShell
      title={ONBOARDING_STEP_TITLE}
      description={ONBOARDING_STEP_DESCRIPTION}
      activeStep={1}
      onSubmit={handleSubmit}
    >
      <OnboardingField
        id="workspace-name"
        label="Workspace / Company name"
        placeholder="e.g. Innovative Labs"
        value={workspaceName}
        onChange={(e) => setWorkspaceName(e.target.value)}
      />

      <div className="space-y-2">
        <OnboardingStepLabel>Your Role</OnboardingStepLabel>
        <ChoiceChips options={ROLES} selected={role} onSelect={setRole} />
      </div>

      <OnboardingStepActions onSkip={onSkip} variant="step1" />
    </OnboardingStepShell>
  );
}
