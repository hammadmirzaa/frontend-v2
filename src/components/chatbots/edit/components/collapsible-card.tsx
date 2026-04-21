"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "../../steps";
import { ImageWrapper } from "@/components/ui";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = true,
  children,
  className,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const iconName = icon?.toString().toLowerCase();
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <ImageWrapper src={`/svgs/${iconName}.svg`} alt={title} width={20} height={20} />
          <span className="text-sm font-bold text-gray-900">{title}</span>
        </div>
        <span className="shrink-0 text-gray-400">
          <ChevronIcon direction={open ? "up" : "down"} />
        </span>
      </button>
      {open && <div className="border-t border-gray-200 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}
