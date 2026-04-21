"use client";

import { ImageWrapper, COLORS, CommonFilterPanel, type FilterFieldConfig } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "most-recent", label: "Most Recent (default)" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

const CHATBOT_OPTIONS = [
  { value: "all", label: "All Chatbots" },
  { value: "1", label: "Chatbot Name" },
  { value: "2", label: "Support Bot" },
  { value: "3", label: "Sales Bot" },
  { value: "4", label: "FAQ Bot" },
];

export type ConversationsFilterValues = {
  sortBy: string;
  chatbots: string;
  dateStart: string;
  dateEnd: string;
};

export const DEFAULT_CONVERSATIONS_FILTERS: ConversationsFilterValues = {
  sortBy: "most-recent",
  chatbots: "all",
  dateStart: "2026-01-15",
  dateEnd: "2026-01-22",
};

export interface ConversationsFiltersProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: ConversationsFilterValues;
  onFiltersChange: (f: ConversationsFilterValues) => void;
  onClear: () => void;
  onApply: () => void;
}

const CONVERSATIONS_FIELDS: FilterFieldConfig[] = [
  { type: "select", id: "conversations-filter-sort", label: "Sort by", valueKey: "sortBy", options: SORT_OPTIONS },
  { type: "select", id: "conversations-filter-chatbots", label: "Chatbots", valueKey: "chatbots", options: CHATBOT_OPTIONS },
  { type: "dateRange", id: "conversations-filter-daterange", label: "Date Range", dateStartKey: "dateStart", dateEndKey: "dateEnd" },
];

export function ConversationsFilters({
  open,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  onClear,
  onApply,
}: ConversationsFiltersProps) {
  return (
    <CommonFilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      defaultFilters={DEFAULT_CONVERSATIONS_FILTERS}
      filters={filters}
      onFiltersChange={onFiltersChange as (patch: Record<string, unknown>) => void}
      onClear={onClear}
      onApply={onApply}
      fields={CONVERSATIONS_FIELDS}
      positionAnchor="left"
    />
  );
}

export function ConversationsFiltersButton({
  open,
  onClick,
  buttonRef,
}: {
  open: boolean;
  onClick: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="flex h-12 shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
      style={{ borderColor: COLORS.CARD_BORDER, color: COLORS.TEXT_TITLE }}
    >
      <ImageWrapper src="/svgs/filter.svg" alt="" width={18} height={18} />
      <span>Filters</span>
      <ImageWrapper src="/svgs/chevron-down.svg" alt="" width={18} height={18} />
    </button>
  );
}
