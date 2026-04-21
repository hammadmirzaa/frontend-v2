"use client";

import { cn } from "@/lib/utils";
import { COLORS, ONBOARDING } from "@/lib/design-tokens";

export interface ChoiceChipsProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  className?: string;
}

export function ChoiceChips({ options, selected, onSelect, className }: ChoiceChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {options.map((label) => {
        const isSelected = selected === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            className={cn(
              "rounded-lg border px-4 py-2  text-sm font-normal transition-colors   "
            )}
            style={{
              backgroundColor: ONBOARDING.INPUT_BG,
              color: isSelected ? COLORS.BRAND : COLORS.BLACK,
              borderColor: isSelected ? COLORS.BRAND : ONBOARDING.INPUT_BG,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
