"use client";

import { useCallback } from "react";
import { FilterPanel } from "./filter-panel";
import { FormField } from "./form-field";
import { Label } from "./typography";
import { ListDropdown } from "./list-dropdown";
import { COLORS } from "@/lib/design-tokens";
import { DateRangePickerField } from "@/components/leads/detail/modals/DateRangePickerField";
import { cn } from "@/lib/utils";

const FILTER = {
  BORDER: COLORS.GRAY_200,
  TITLE: COLORS.TEXT_TITLE,
  ACTIVE_BG: COLORS.BRAND_ACTIVE_BG,
  SUBTEXT: COLORS.SUBTEXT,
} as const;


export type FilterFieldSelect = {
  type: "select";
  id: string;
  label: string;
  valueKey: string;
  options: { value: string; label: string }[];
};

export type FilterFieldChips = {
  type: "chips";
  id: string;
  label: string;
  valueKey: string;
  options: { value: string; label: string }[];
  /** "bold" for purple bold (e.g. Guardrails), "title" for gray title (e.g. KB) */
  activeStyle?: "bold" | "title";
};

export type FilterFieldDateRange = {
  type: "dateRange";
  id: string;
  label: string;
  dateStartKey: string;
  dateEndKey: string;
};

export type FilterFieldConfig =
  | FilterFieldSelect
  | FilterFieldChips
  | FilterFieldDateRange;

export interface CommonFilterPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  /** Default filter values; used when Clear is clicked */
  defaultFilters: Record<string, unknown>;
  filters: Record<string, unknown>;
  onFiltersChange: (patch: Record<string, unknown>) => void;
  onClear: () => void;
  onApply: () => void;
  fields: FilterFieldConfig[];
  positionAnchor?: "left" | "right";
  className?: string;
}

export function CommonFilterPanel({
  open,
  onClose,
  anchorRef,
  defaultFilters,
  filters,
  onFiltersChange,
  onClear,
  onApply,
  fields,
  positionAnchor = "right",
  className,
}: CommonFilterPanelProps) {
  const setFilters = useCallback(
    (patch: Record<string, unknown>) =>
      onFiltersChange({ ...filters, ...patch }),
    [filters, onFiltersChange]
  );

  const handleClear = () => {
    onFiltersChange({ ...defaultFilters });
    onClear();
    onClose();
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <FilterPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      title="Filter Options"
      onClear={handleClear}
      onApply={handleApply}
      positionAnchor={positionAnchor}
      className={className}
    >
      {fields.map((field) => {
        if (field.type === "select") {
          const value = (filters[field.valueKey] as string) ?? "";
          return (
            <FormField key={field.id} id={field.id} label={field.label}>
              <ListDropdown
                id={field.id}
                value={value}
                onChange={(v) => setFilters({ [field.valueKey]: v })}
                options={field.options}
                className="h-10 w-full rounded-lg border bg-white text-sm"
              />
            </FormField>
          );
        }

        if (field.type === "chips") {
          const value = (filters[field.valueKey] as string) ?? "";
          const activeStyle = field.activeStyle ?? "title";
          return (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-bold text-gray-900">
                {field.label}
              </Label>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => {
                  const isActive = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters({ [field.valueKey]: opt.value })}
                      className={cn(
                        "min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-colors sm:flex-none",
                        isActive ? "border-transparent" : "bg-white hover:bg-gray-50"
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: FILTER.ACTIVE_BG,
                              color: activeStyle === "bold" ? COLORS.BRAND : FILTER.TITLE,
                              fontWeight: activeStyle === "bold" ? "bold" : 600,
                            }
                          : { borderColor: FILTER.BORDER, color: FILTER.SUBTEXT }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.type === "dateRange") {
          const dateStart = (filters[field.dateStartKey] as string) ?? "";
          const dateEnd = (filters[field.dateEndKey] as string) ?? "";
          return (
            <FormField key={field.id} id={field.id} label={field.label}>
              <DateRangePickerField
                id={field.id}
                dateStart={dateStart}
                dateEnd={dateEnd}
                onChange={(range) =>
                  setFilters({
                    [field.dateStartKey]: range.dateStart,
                    [field.dateEndKey]: range.dateEnd,
                  })
                }
                placeholder="Select date range"
                style={{ border: "none" }}
              />
            </FormField>
          );
        }

        return null;
      })}
    </FilterPanel>
  );
}
