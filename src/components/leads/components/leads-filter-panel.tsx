"use client";

import { CommonFilterPanel, type FilterFieldConfig } from "@/components/ui";
import type { LeadRow } from "@/contexts/leads-context";

const STATUS_OPTIONS: { value: LeadRow["status"] | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const PRIORITY_OPTIONS: { value: LeadRow["priority"] | "all"; label: string }[] = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "Chatbot", label: "Chatbot" },
  { value: "Website", label: "Website" },
];

export type LeadsFilters = {
  status: LeadRow["status"] | "all";
  priority: LeadRow["priority"] | "all";
  source: string;
};

export const DEFAULT_LEADS_FILTERS: LeadsFilters = {
  status: "all",
  priority: "all",
  source: "all",
};

export interface LeadsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: LeadsFilters;
  onFiltersChange: (f: LeadsFilters) => void;
  onClear: () => void;
  onApply: () => void;
}

const LEADS_FIELDS: FilterFieldConfig[] = [
  { type: "select", id: "leads-filter-status", label: "Status", valueKey: "status", options: STATUS_OPTIONS },
  { type: "select", id: "leads-filter-priority", label: "Priority", valueKey: "priority", options: PRIORITY_OPTIONS },
  { type: "select", id: "leads-filter-source", label: "Source", valueKey: "source", options: SOURCE_OPTIONS },
];

export function LeadsFilterPanel({
  open,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  onClear,
  onApply,
}: LeadsFilterPanelProps) {
  return (
    <CommonFilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      defaultFilters={DEFAULT_LEADS_FILTERS}
      filters={filters}
      onFiltersChange={onFiltersChange as (patch: Record<string, unknown>) => void}
      onClear={onClear}
      onApply={onApply}
      fields={LEADS_FIELDS}
      positionAnchor="right"
    />
  );
}
