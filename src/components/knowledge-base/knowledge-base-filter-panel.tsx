"use client";

import { useMemo } from "react";
import { CommonFilterPanel, type FilterFieldConfig } from "@/components/ui";

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "upload", label: "Documents" },
  { value: "manual", label: "Manual" },
];

export type KnowledgeBaseFilters = {
  linkedChatbotId: string;
  type: "all" | "upload" | "manual";
  dateStart: string;
  dateEnd: string;
};

export const DEFAULT_KNOWLEDGE_BASE_FILTERS: KnowledgeBaseFilters = {
  linkedChatbotId: "all",
  type: "all",
  dateStart: "",
  dateEnd: "",
};

export interface KnowledgeBaseFilterPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: KnowledgeBaseFilters;
  onFiltersChange: (f: KnowledgeBaseFilters) => void;
  onClear: () => void;
  onApply: () => void;
  chatbotOptions: { id: string; name: string }[];
}

export function KnowledgeBaseFilterPanel({
  open,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  onClear,
  onApply,
  chatbotOptions,
}: KnowledgeBaseFilterPanelProps) {
  const fields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        type: "select",
        id: "kb-filter-linked-chatbots",
        label: "Linked Chatbots",
        valueKey: "linkedChatbotId",
        options: [
          { value: "all", label: "All Chatbots" },
          ...chatbotOptions.map((c) => ({ value: c.id, label: c.name })),
        ],
      },
      { type: "chips", id: "kb-filter-type", label: "Type", valueKey: "type", options: TYPE_OPTIONS, activeStyle: "title" },
      { type: "dateRange", id: "kb-filter-date-range", label: "Date Range", dateStartKey: "dateStart", dateEndKey: "dateEnd" },
    ],
    [chatbotOptions]
  );

  return (
    <CommonFilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      defaultFilters={DEFAULT_KNOWLEDGE_BASE_FILTERS}
      filters={filters}
      onFiltersChange={onFiltersChange as (patch: Record<string, unknown>) => void}
      onClear={onClear}
      onApply={onApply}
      fields={fields}
      positionAnchor="right"
      className="max-w-[428px] sm:min-w-[320px]"
    />
  );
}
