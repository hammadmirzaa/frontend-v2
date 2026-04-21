"use client";

import { ReactNode } from "react";
import { ONBOARDING } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface OverviewFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

/**
 * Reusable feature block for product overview: icon, title, description in a rounded card.
 */
export function OverviewFeatureCard({
  icon,
  title,
  description,
  className,
}: OverviewFeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card-bg p-5 shadow-sm",
        className
      )}
      style={{
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="mb-3 flex items-center justify-start">{icon}</div>
      <h3
        className="mb-2 text-base font-bold"
        style={{ color: ONBOARDING.TEXT_TITLE }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: ONBOARDING.TEXT_MUTED }}
      >
        {description}
      </p>
    </div>
  );
}
