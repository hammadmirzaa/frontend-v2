export interface WizardStepConfig {
  id: string;
  label: string;
  iconKey: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: "basic", label: "Basic Information", iconKey: "BasicInformation" },
  { id: "guardrails", label: "Guardrails & Restrictions", iconKey: "G&r" },
  { id: "knowledge", label: "Knowledge Base", iconKey: "Knowledge" },
  { id: "preview", label: "Preview", iconKey: "Preview" },
];

export interface CreateChatbotFormData {
  chatbotName: string;
  widgetTitle: string;
  initialMessage: string;
  systemInstructions: string;
  tone: string;
  advancedVisible: boolean;
  guardrailName: string;
  restrictions: Record<string, boolean>;
  customRestriction: string;
  uploadedFiles: { id: string; name: string }[];
  writeManuallyExpanded: boolean;
  manualKnowledge: string;
}

export const INITIAL_FORM_DATA: CreateChatbotFormData = {
  chatbotName: "",
  widgetTitle: "",
  initialMessage: "",
  systemInstructions: "",
  tone: "neutral",
  advancedVisible: true,
  guardrailName: "",
  restrictions: {},
  customRestriction: "",
  uploadedFiles: [],
  writeManuallyExpanded: true,
  manualKnowledge: "",
};

export const TONE_OPTIONS = [
  { id: "neutral", label: "Neutral", iconName: "neutral" },
  { id: "friendly", label: "Friendly", iconName: "friendly" },
  { id: "formal", label: "Formal", iconName: "formal" },
  { id: "custom", label: "Custom", iconName: "custom" },
] as const;

export const RESTRICTION_OPTIONS = [
  "Share personal or identifiable information",
  "Share financial information",
  "Share medical information",
  "Provide legal advice",
] as const;

export const EMBED_CODE = `<script src="https://be.meichat.meissasoftlogic.com/static/plugin.js" data-chatbot-id="your-chatbot-id" data-api-url="https://be.meichat.meissasoftlogic.com" data-widget-url="https://meichat.meissasoftlogic.com/"></script>`;

export function formatCreatedAt(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
