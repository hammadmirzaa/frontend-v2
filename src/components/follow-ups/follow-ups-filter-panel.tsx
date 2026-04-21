"use client";

import { CommonFilterPanel, type FilterFieldConfig } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "due-date-asc", label: "Due Date (Acs.)" },
  { value: "due-date-desc", label: "Due Date (Desc.)" },
];

const CHATBOT_OPTIONS = [
  { value: "all", label: "All Chatbots" },
  { value: "welcome-bot", label: "Welcome Bot" },
  { value: "follow-up-bot", label: "Follow-up Bot" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "sms", label: "SMS" },
  { value: "email-sms", label: "Email + SMS" },
];

export type FollowUpsFilters = {
  sortBy: string;
  chatbots: string;
  type: string;
  dateStart: string;
  dateEnd: string;
};

export const DEFAULT_FOLLOW_UPS_FILTERS: FollowUpsFilters = {
  sortBy: "due-date-asc",
  chatbots: "all",
  type: "email",
  dateStart: "2026-01-15",
  dateEnd: "2026-01-22",
};

export interface FollowUpsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: FollowUpsFilters;
  onFiltersChange: (f: FollowUpsFilters) => void;
  onClear: () => void;
  onApply: () => void;
}

const FOLLOW_UPS_FIELDS: FilterFieldConfig[] = [
  { type: "select", id: "followups-filter-sort", label: "Sort by", valueKey: "sortBy", options: SORT_OPTIONS },
  { type: "select", id: "followups-filter-chatbots", label: "Chatbots", valueKey: "chatbots", options: CHATBOT_OPTIONS },
  { type: "select", id: "followups-filter-type", label: "Type", valueKey: "type", options: TYPE_OPTIONS },
  { type: "dateRange", id: "followups-filter-daterange", label: "Date Range", dateStartKey: "dateStart", dateEndKey: "dateEnd" },
];

export function FollowUpsFilterPanel({
  open,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  onClear,
  onApply,
}: FollowUpsFilterPanelProps) {
  return (
    <CommonFilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      defaultFilters={DEFAULT_FOLLOW_UPS_FILTERS}
      filters={filters}
      onFiltersChange={onFiltersChange as (patch: Record<string, unknown>) => void}
      onClear={onClear}
      onApply={onApply}
      fields={FOLLOW_UPS_FIELDS}
      positionAnchor="left"
    />
  );
}
