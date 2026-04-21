"use client";

import { CardContent, Input, Textarea, FormField, Label, Checkbox } from "@/components/ui";
import type { CreateChatbotFormData } from "../types";
import { RESTRICTION_OPTIONS } from "../types";
import { StepCardHeader } from "./step-card-header";

type SetFormData = React.Dispatch<React.SetStateAction<CreateChatbotFormData>>;

interface GuardrailsStepProps {
  formData: CreateChatbotFormData;
  setFormData: SetFormData;
}

export function GuardrailsStep({ formData, setFormData }: GuardrailsStepProps) {
  const toggleRestriction = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: { ...prev.restrictions, [key]: !prev.restrictions[key] },
    }));
  };

  return (
    <>
      <StepCardHeader
        title="Guardrails & Restrictions"
        description="Define how your chatbot should behave with users."
      />
      <CardContent className="space-y-6 pt-0">
        <FormField
          id="guardrail-name"
          label="Guardrail Name"
          helperText="No special characters; 3-20 characters long."
        >
          <Input
            id="guardrail-name"
            placeholder="eg. Customer Support Restrictions"
            value={formData.guardrailName}
            onChange={(e) => setFormData((prev) => ({ ...prev, guardrailName: e.target.value }))}
            className="rounded-lg border-gray-50 placeholder:text-gray-400"
          />
        </FormField>

        <div className="space-y-2">
          <Label className="block text-sm font-bold text-gray-900">
            Restrictions
          </Label>
          <div className="space-y-3">
            {RESTRICTION_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-3"
              >
                <Checkbox
                  checked={formData.restrictions[opt] ?? false}
                  onChange={() => toggleRestriction(opt)}
                  className="h-4 w-4 rounded border-gray-50 text-indigo-600 focus:ring-0"
                />
                <span className="text-sm text-gray-900">{opt}</span>
              </label>
            ))}
          </div>
          <Textarea
            placeholder="Describe a custom restriction..."
            value={formData.customRestriction}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, customRestriction: e.target.value }))
            }
            rows={3}
            className="mt-3 min-h-[100px] resize-y rounded-lg border-gray-200 bg-white placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400">
            At least one restriction is required.
          </p>
        </div>
      </CardContent>
    </>
  );
}
