"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "./image-wrapper";

export interface SidebarListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const defaultIcon = (
  <div
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
    style={{ backgroundColor: `${COLORS.BRAND}20` }}
    aria-hidden
  >
    <ImageWrapper src="/svgs/bot2.svg" alt="" width={16} height={16} />
  </div>
);

export function SidebarListItem({
  title,
  subtitle,
  icon,
  selected = false,
  onClick,
  className,
}: SidebarListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl  p-3 text-left transition-colors cursor-pointer",
        selected
          ? " text-title"
          : " bg-white text-title hover:border-gray-300 hover:bg-gray-50",
        className
      )}
      style={selected ? { backgroundColor: COLORS.INPUT_BRAND_SELECTED } : undefined}
    >
      <div className="min-w-0 flex-1 flex items-center justify-between p-1  ">
        <p className="truncate text-sm font-normal">{title}</p>
        {subtitle && (
          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
