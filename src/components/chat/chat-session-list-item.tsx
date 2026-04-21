"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface ChatSessionListItemProps {
  title: string;
  meta?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ChatSessionListItem({
  title,
  meta,
  selected = false,
  onClick,
  className,
}: ChatSessionListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between",
        selected ? "text-gray-900" : "text-gray-600 hover:bg-gray-100",
        className
      )}
      style={
        selected
          ? { backgroundColor: `${COLORS.BRAND}15` }
          : undefined
      }
    >
      <div className="font-medium truncate">{title}</div>
      {meta && (
        <div className="mt-0.5 text-xs text-gray-500">{meta}</div>
      )}
    </button>
  );
}
