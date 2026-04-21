"use client";

import { ONBOARDING } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface BenefitsListProps {
  title?: string;
  items: string[];
  className?: string;
}

export function BenefitsList({
  title = "Benefits",
  items,
  className,
}: BenefitsListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3
        className="text-sm font-normal"
        style={{ color: ONBOARDING.TEXT_TITLE }}
      >
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1 text-sm ml-3 " style={{ color: ONBOARDING.TEXT_TITLE }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
