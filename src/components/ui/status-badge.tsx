"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface StatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-5 py-2 text-xs font-semibold  ",
        !isActive && "bg-gray-100",
        className
      )}
      style={
        isActive
          ? { backgroundColor: COLORS.ACTIVE_COLOR, color: COLORS.ACTIVE_COLOR_TEXT }
          : undefined
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}