"use client";

import { useState, useRef, useEffect } from "react";
import { COLORS, ImageWrapper, zIndex } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface FilterDropdownOption<T extends string> {
  value: T;
  label: string;
}

export interface LeadsFilterDropdownProps<T extends string> {
  options: FilterDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  showFilterIcon?: boolean;
}

export function LeadsFilterDropdown<T extends string>({
  options,
  value,
  onChange,
  label,
  showFilterIcon,
}: LeadsFilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayLabel = options.find((o) => o.value === value)?.label ?? label;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" style={{ zIndex: zIndex.dropdown }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
        )}
        style={{ borderColor: COLORS.CARD_BORDER, color: COLORS.TEXT_TITLE }}
      >
        {showFilterIcon && (
          <ImageWrapper src="/svgs/filter.svg" alt="" width={18} height={18} />
        )}
        <span>{displayLabel}</span>
        <span className={cn("inline-block transition-transform", open && "rotate-180")}>
          <ImageWrapper src="/svgs/chevron-down.svg" alt="" width={18} height={18} />
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 min-w-[160px] rounded-xl border bg-white py-1 shadow-lg"
          style={{ borderColor: COLORS.CARD_BORDER, zIndex: zIndex.dropdown }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50"
                style={
                  isSelected
                    ? { color: COLORS.BRAND_TITLE, backgroundColor: COLORS.BRAND_ACTIVE_BG }
                    : { color: COLORS.TEXT_TITLE }
                }
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
