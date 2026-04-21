"use client";

import { CommonFilterPanel, type FilterFieldConfig } from "@/components/ui";

const LINKED_CHATBOTS_OPTIONS = [{ value: "all", label: "All Chatbots" }];

const STATUS_OPTIONS = [
  { value: "all", label: "all" },
  { value: "active", label: "active" },
  { value: "inactive", label: "inactive" },
];

export type GuardrailsFilters = {
  linkedChatbots: string;
  status: "all" | "active" | "inactive";
  dateStart: string;
  dateEnd: string;
};

export const DEFAULT_GUARDRAILS_FILTERS: GuardrailsFilters = {
  linkedChatbots: "all",
  status: "all",
  dateStart: "",
  dateEnd: "",
};

export interface GuardrailsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: GuardrailsFilters;
  onFiltersChange: (f: GuardrailsFilters) => void;
  onClear: () => void;
  onApply: () => void;
}

const GUARDRAILS_FIELDS: FilterFieldConfig[] = [
  { type: "select", id: "filter-linked-chatbots", label: "Linked Chatbots", valueKey: "linkedChatbots", options: LINKED_CHATBOTS_OPTIONS },
  { type: "chips", id: "filter-status", label: "Chatbots", valueKey: "status", options: STATUS_OPTIONS, activeStyle: "bold" },
  { type: "dateRange", id: "guardrails-filter-date-range", label: "Date Range", dateStartKey: "dateStart", dateEndKey: "dateEnd" },
];

export function GuardrailsFilterPanel({
  open,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  onClear,
  onApply,
}: GuardrailsFilterPanelProps) {
  return (
    <CommonFilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      defaultFilters={DEFAULT_GUARDRAILS_FILTERS}
      filters={filters}
      onFiltersChange={onFiltersChange as (patch: Record<string, unknown>) => void}
      onClear={onClear}
      onApply={onApply}
      fields={GUARDRAILS_FIELDS}
      positionAnchor="right"
      className="max-w-[428px] sm:min-w-[320px]"
    />
  );
}
