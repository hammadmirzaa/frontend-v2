"use client";

import { useState } from "react";
import {
  Input,
  Textarea,
  FormField,
  ListDropdown,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { EmbedCode } from "../../embedCode";
import { EMBED_CODE } from "../../types";
import { TONE_OPTIONS } from "../../types";
import { CollapsibleCard } from "../components/collapsible-card";
import { OptionButtonGroup } from "../../option-button-group";

export function CustomizationSection() {
  const [title, setTitle] = useState("Chat Assistant");
  const [initialMessage, setInitialMessage] = useState(
    "👋 Hi! I'm your AI assistant. How can I help today?"
  );
  const [position, setPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState("#1EFFC7");
  const [secondaryColor, setSecondaryColor] = useState("#00AD82");
  const [voice, setVoice] = useState("adam");
  const [tone, setTone] = useState("neutral");
  const [instructions, setInstructions] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("en-US");
  const [supportedLanguages, setSupportedLanguages] = useState("");

  const copyEmbedCode = () => {
    void navigator.clipboard.writeText(EMBED_CODE);
  };

  return (
    <div className="space-y-8 rounded-xl" >
      <div>
        <h2 className="text-lg font-bold text-gray-900">Customization</h2>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: COLORS.WHITE }}  >

      <div className="space-y-2">
        <EmbedCode
          embedCode={EMBED_CODE}
          copyEmbedCode={copyEmbedCode}
          description="Paste this code into your website's HTML where you want the chatbot to appear."
        />
      </div>

      <div className="space-y-2 mt-5 ">
        <h3 className="text-base font-bold text-gray-900">Preview</h3>
        <div className="min-h-[177px] rounded-lg border border-gray-200 bg-gray-50">
          <div className="relative h-full min-h-[177px] p-6">
            <div className="absolute bottom-4 right-4 flex">
              <ImageWrapper src="/svgs/preview.svg" alt="preview" width={40} height={40} />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Floating chatbot button will appear in the bottom-right corner.
        </p>
      </div>
      </div>
      <CollapsibleCard
          title="Widget Settings"
          icon="settings"
        defaultOpen={true}
      >
        <div className="space-y-4">
          <FormField id="widget-title" label="Title">
            <Input
              id="widget-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border-gray-50 bg-gray-50"
            />
          </FormField>
          <FormField id="initial-message" label="Initial Message">
            <Textarea
              id="initial-message"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={2}
              className="min-h-[80px] rounded-lg border-gray-50 bg-gray-50"
            />
          </FormField>
          <FormField id="position" label="Position">
            <ListDropdown
              id="position"
              value={position}
              onChange={setPosition}
              options={[
                { value: "bottom-right", label: "Bottom Right (default)" },
                { value: "bottom-left", label: "Bottom Left" },
                { value: "top-right", label: "Top Right" },
                { value: "top-left", label: "Top Left" },
              ]}
              className="rounded-lg border-gray-200 bg-gray-50"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="primary-color" label="Primary Color">
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="rounded-lg border-gray-50 bg-gray-50 font-mono text-sm"
                />
              </div>
            </FormField>
            <FormField id="secondary-color" label="Secondary Color">
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="rounded-lg border-gray-50 bg-gray-50 font-mono text-sm"
                />
              </div>
            </FormField>
          </div>
          <FormField id="voice" label="Voice">
            <ListDropdown
              id="voice"
              value={voice}
              onChange={setVoice}
              options={[
                { value: "adam", label: "Adam" },
                { value: "bella", label: "Bella" },
                { value: "charlie", label: "Charlie" },
              ]}
              prefix={<ImageWrapper src="/svgs/assistant.svg" alt="" width={20} height={20} />}
              className="rounded-lg border-gray-200 bg-gray-50"
            />
          </FormField>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="System Instructions"
        icon="document-text"
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Customize how your chatbot behaves. You can select a template or write your own instructions.
          </p>
          <button
            type="button"
            className="rounded-lg px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            style={{ color: COLORS.BRAND_TITLE, backgroundColor: COLORS.INPUT_BRAND_SELECTED }}
          >
            Select Template
          </button>
          </div>
          <OptionButtonGroup
            label="Tone of voice"
            options={TONE_OPTIONS.map((o) => ({ id: o.id, label: o.label, iconName: o.iconName }))}
            value={tone}
            onChange={setTone}
          />
          <FormField id="instructions" label="Instructions">
            <Textarea
              id="instructions"
              placeholder="Write your guidance here, focusing on one topic for each piece. You can test this guidance in the preview without saving or enabling it"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              className="min-h-[140px] rounded-lg border-gray-50 bg-gray-50"
            />
          </FormField>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Language Settings"
        icon="globe"
        defaultOpen={true}
      >
        <div className="space-y-4">
          <FormField
            id="primary-language"
            label="Primary Language (Required)"
            helperText="The default language used by the agent when no language is detected."
          >
            <ListDropdown
              id="primary-language"
              value={primaryLanguage}
              onChange={setPrimaryLanguage}
              options={[
                { value: "en-US", label: "English (United States)" },
                { value: "en-GB", label: "English (United Kingdom)" },
                { value: "es", label: "Spanish" },
                { value: "fr", label: "French" },
                { value: "de", label: "German" },
              ]}
              className="rounded-lg border-gray-200 bg-gray-50"
            />
          </FormField>
          <FormField
            id="supported-languages"
            label="Supported Languages"
            helperText="Search the languages this agent can respond in."
          >
            <Input
              id="supported-languages"
              placeholder="Add supported languages..."
              value={supportedLanguages}
              onChange={(e) => setSupportedLanguages(e.target.value)}
              className="rounded-lg border-gray-200 bg-gray-white"
            />
          </FormField>
        </div>
      </CollapsibleCard>
    </div>
  );
}
