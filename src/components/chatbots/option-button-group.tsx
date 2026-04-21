"use client";

import { cn } from "@/lib/utils";
import { COLORS, ImageWrapper } from "../ui";

export interface OptionItem {
  id: string;
  label: string;
  iconName?: string;
}

interface OptionButtonGroupProps {
  label: string;
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function OptionButtonGroup({
  label,
  options,
  value,
  onChange,
  className,
}: OptionButtonGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-bold text-title">
        {label}
      </label>

      <div className="flex items-center justify-between gap-4">
        {options.map((opt) => {
          const isActive = value === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "w-full inline-flex justify-center items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors bg-input-bg cursor-pointer",
              )}
              style={{
                borderColor: isActive ? COLORS.BRAND_BORDER : COLORS.GRAY_200,
                color:COLORS.GRAY_900,
              }}
            >
              {opt.iconName && (
                <ImageWrapper
                  src={`/svgs/${opt.iconName.toLowerCase()}.svg`}
                  alt={opt.label}
                  width={20}
                  height={20}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}