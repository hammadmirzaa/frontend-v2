"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "@/components/ui";

export interface ChatbotCardProps {
  name: string;
  date: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function ChatbotIconPlaceholder() {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${COLORS.BRAND}20` }}
      aria-hidden
    >
      <ImageWrapper src="/svgs/bot2.svg" alt="Chatbot Icon" width={16} height={16} />
    </div>
  );
}

export function   ChatbotCard({
  name,
  date,
  selected = false,
  onClick,
  className,
}: ChatbotCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer",
        selected
          ? "border-brand bg-white text-title"
          : "border-gray-200 bg-white text-title hover:border-gray-300 hover:bg-gray-50",
        className
      )}
      style={
        selected
          ? { backgroundColor: COLORS.BRAND_ACTIVE_BG, borderColor: COLORS.BRAND }
          : undefined
      }
    >
      {selected && (
        <span
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ backgroundColor: COLORS.BRAND }}
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
      <ChatbotIconPlaceholder />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className={cn("text-xs", "text-gray-500")}>
          {date}
        </p>
      </div>
    </button>
  );
}
