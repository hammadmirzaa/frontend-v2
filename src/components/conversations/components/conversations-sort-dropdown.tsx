"use client";

import { useState, useRef, useEffect } from "react";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "most-recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
] as const;

export type ConversationsSortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface ConversationsSortDropdownProps {
  value: ConversationsSortValue;
  onChange: (value: ConversationsSortValue) => void;
  className?: string;
}

export function ConversationsSortDropdown({
  value,
  onChange,
  className,
}: ConversationsSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Most Recent";

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border-0 px-3 text-left text-sm",
          "bg-gray-100 text-gray-900 placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-0",
          "cursor-pointer"
        )}
        style={{ backgroundColor: COLORS.GRAY_100 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort chatbots"
      >
        <span>
          <span className="font-semibold" style={{ color: COLORS.TEXT_TITLE }}>
            Sort by
          </span>
          <span className="ml-1 font-normal" style={{ color: COLORS.TEXT_MUTED }}>
            ({currentLabel})
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          style={{ color: COLORS.ICON_PRIMARY }}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                    isSelected && "font-semibold"
                  )}
                  style={{
                    backgroundColor: isSelected ? COLORS.BRAND_ACTIVE_BG : undefined,
                    color: isSelected ? COLORS.BRAND_TITLE : COLORS.TEXT_BODY,
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
