"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface ListDropdownOption {
  value: string;
  label: string;
}

export interface ListDropdownProps {
  id?: string;
  options: ListDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional content (e.g. icon) shown before the label in the trigger */
  prefix?: React.ReactNode;
}

export function ListDropdown({
  id,
  options,
  value,
  onChange,
  placeholder,
  className,
  prefix,
}: ListDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const currentLabel = selectedOption?.label ?? placeholder ?? "";
  const isPlaceholder = !selectedOption && (value === "" || !value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer",
          className
        )}
        style={{
          borderColor: COLORS.GRAY_200,
          color: isPlaceholder ? COLORS.TEXT_MUTED : COLORS.TEXT_TITLE,
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {prefix}
          <span className="truncate">{currentLabel}</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 opacity-70"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[100] mt-1 min-w-full overflow-hidden rounded-lg border bg-white py-1 shadow-lg"
          style={{ borderColor: COLORS.GRAY_200 }}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                style={{
                  backgroundColor: isSelected ? COLORS.BRAND_ACTIVE_BG : undefined,
                  color: isSelected ? COLORS.BRAND_TITLE : COLORS.TEXT_TITLE,
                  fontWeight: isSelected ? 600 : undefined,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
