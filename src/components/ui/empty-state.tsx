"use client";

import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  /** Optional wrapper around the icon (e.g. light purple background for Conversations). */
  iconContainerClassName?: string;
  iconContainerStyle?: React.CSSProperties;
}

export function EmptyState({
  icon,
  title,
  description,
  className,
  iconContainerClassName,
  iconContainerStyle,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-xl",
          iconContainerClassName
        )}
        style={iconContainerStyle}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: COLORS.TEXT_TITLE }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          {description}
        </p>
      )}
    </div>
  );
}
