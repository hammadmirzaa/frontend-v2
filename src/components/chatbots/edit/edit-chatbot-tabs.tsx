"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export type EditChatbotTabId = "customization" | "guardrails" | "knowledge-base";

const TABS: { id: EditChatbotTabId; label: string }[] = [
  { id: "customization", label: "Customization" },
  { id: "guardrails", label: "Guardrails" },
  { id: "knowledge-base", label: "Knowledge Base" },
];

interface EditChatbotTabsProps {
  activeTab: EditChatbotTabId;
  onTabChange: (tab: EditChatbotTabId) => void;
}

export function EditChatbotTabs({ activeTab, onTabChange }: EditChatbotTabsProps) {
  return (
    <div className="flex gap-3 px-2 border my-2 border-gray-50 bg-white py-2 rounded-2xl ">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ",
              isActive
                ? "text-white"
                : "text-gray-500 hover:text-gray-700"
            )}
            style={
              isActive
                ? { backgroundColor: COLORS.BRAND }
                : undefined
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
