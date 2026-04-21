"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { Card, WizardStepper } from "@/components/ui";
import { useChatbots } from "@/contexts/chatbots-context";
import {
  WIZARD_STEPS,
  INITIAL_FORM_DATA,
  formatCreatedAt,
  type CreateChatbotFormData,
} from "./types";
import {
  BasicInformationStep,
  GuardrailsStep,
  KnowledgeBaseStep,
  PreviewStep,
} from "./steps";
import { WizardFooter } from "./wizard-footer";

export function CreateChatbotWizard() {
  const router = useRouter();
  const { addChatbot } = useChatbots();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateChatbotFormData>(INITIAL_FORM_DATA);

  const totalSteps = WIZARD_STEPS.length;

  const handleActivate = () => {
    const name = formData.chatbotName.trim() || "Untitled Chatbot";
    addChatbot({
      name,
      status: "active",
      createdAt: formatCreatedAt(),
    });
    router.push("/chatbots");
  };

  return (
    <AppLayout title="Chatbots">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            Create a New Chatbot
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Tailor your assistant&apos;s look, tone, and voice to fit your brand.
          </p>
        </header>

        <WizardStepper
          steps={WIZARD_STEPS}
          currentStepIndex={step - 1}
          className="mb-10"
        />

        <Card className="overflow-hidden rounded-xl border-gray-200 shadow-sm">
          {step === 1 && (
            <BasicInformationStep formData={formData} setFormData={setFormData} />
          )}
          {step === 2 && (
            <GuardrailsStep formData={formData} setFormData={setFormData} />
          )}
          {step === 3 && (
            <KnowledgeBaseStep formData={formData} setFormData={setFormData} />
          )}
          {step === 4 && <PreviewStep />}
        </Card>

        <WizardFooter
          step={step}
          totalSteps={totalSteps}
          onBack={() => setStep((s) => s - 1)}
          onNext={() => setStep((s) => s + 1)}
          onActivate={handleActivate}
        />
      </div>
    </AppLayout>
  );
}
