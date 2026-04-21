"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

const TOTAL_STEPS = 4;

export interface ProgressStepsProps {
  activeStep: number;
  className?: string;
}


export function ProgressSteps({ activeStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("flex items-center gap-4 mb-10 ", className)}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const isActive = i < activeStep;
        return (
          <div
            key={i}
            className="h-[3px] flex-1 min-w-[71px] rounded-full transition-colors"
            style={{
              backgroundColor: isActive ? COLORS.BRAND : COLORS.BORDER_INACTIVE,
              boxShadow: isActive ? `0 0 12px ${COLORS.BRAND}40` : undefined,
            }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
