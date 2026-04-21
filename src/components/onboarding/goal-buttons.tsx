"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING } from "@/lib/design-tokens";

export interface GoalButtonsProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  className?: string;
}

export function GoalButtons({ options, selected, onSelect, className }: GoalButtonsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2", className)}>
      {options.map((label) => {
        const isSelected = selected === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-normal text-left transition-colors"
            )}
            style={{
              backgroundColor: ONBOARDING.GOAL_BUTTON_BG,
              color: ONBOARDING.TEXT_BODY,
              borderColor: ONBOARDING.GOAL_BUTTON_BORDER,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
