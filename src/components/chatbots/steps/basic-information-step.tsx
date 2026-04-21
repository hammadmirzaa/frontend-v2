"use client";

import {
  CardContent,
  Input,
  Textarea,
  FormField,
  Label,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CreateChatbotFormData } from "../types";
import { TONE_OPTIONS } from "../types";
import { StepCardHeader } from "./step-card-header";
import { ChevronIcon } from "./chevron-icon";
import { OptionButtonGroup } from "../option-button-group";

type SetFormData = React.Dispatch<React.SetStateAction<CreateChatbotFormData>>;

interface BasicInformationStepProps {
  formData: CreateChatbotFormData;
  setFormData: SetFormData;
}

export function BasicInformationStep({
  formData,
  setFormData,
}: BasicInformationStepProps) {
  const update = (key: keyof CreateChatbotFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <StepCardHeader
        title="Basic Information"
        description="Start with the essentials to get your chatbot up and running."
      />
      <CardContent className="space-y-6 pt-0">
        <FormField
          id="chatbot-name"
          label="Chatbot Name"
          required
          helperText="No special characters; 3-20 characters long."
        >
          <Input
            id="chatbot-name"
            placeholder="eg. Customer Support Bot"
            value={formData.chatbotName}
            onChange={(e) => update("chatbotName", e.target.value)}
            className="rounded-lg border-gray-50 placeholder:text-gray-400"
          />
        </FormField>

        <button
          type="button"
          onClick={() => update("advancedVisible", !formData.advancedVisible)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <span style={{ color: COLORS.BRAND }} className="font-bold">
            {formData.advancedVisible ? "Hide" : "Show"} Advanced Options
          </span>
          <ChevronIcon direction={formData.advancedVisible ? "up" : "down"} />
        </button>

        {formData.advancedVisible && (
          <div className="border-l px-4" style={{ borderColor: COLORS.BRAND_ACTIVE_BG }}>
            <FormField id="widget-title" label="Widget Title">
              <Input
                id="widget-title"
                placeholder="Chat Assistant"
                value={formData.widgetTitle}
                onChange={(e) => update("widgetTitle", e.target.value)}
                className="rounded-lg border-gray-50 placeholder:text-gray-400 mb-4 "
              />
            </FormField>

            <FormField id="initial-message" label="Initial Message">
              <Textarea
                id="initial-message"
                placeholder="Hi! How can I help you today?"
                value={formData.initialMessage}
                onChange={(e) => update("initialMessage", e.target.value)}
                rows={3}
                className="min-h-[100px] resize-y rounded-lg border-gray-50 placeholder:text-gray-400 mb-4"
                style={{
                  backgroundColor: COLORS.INPUT_BG,
                }}
              />
            </FormField>

            <OptionButtonGroup
              label="Tone of Voice"
              options={TONE_OPTIONS.map((o) => ({ id: o.id, label: o.label, iconName: o.iconName }))}
              value={formData.tone}
              onChange={(val) => update("tone", val)}
              className="mb-4"
            />

            <FormField
              id="system-instructions"
              label="System Instructions"
              description="Write your guidance here, focusing on role tasks to auto-handle. You can add Zia guidance or in the preview without writing an existing AI."
            >
              <Textarea
                id="system-instructions"
                placeholder="Customize how your chatbot behaves. You can write your own instructions."
                value={formData.systemInstructions}
                onChange={(e) => update("systemInstructions", e.target.value)}
                rows={6}
                className="min-h-[180px] resize-y rounded-lg border-gray-200 bg-white placeholder:text-gray-400"
              />
            </FormField>
          </div>
        )}
      </CardContent>
    </>
  );
}
