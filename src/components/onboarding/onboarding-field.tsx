"use client";

import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { COLORS, ONBOARDING } from "@/lib/design-tokens";

export interface OnboardingFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "className"> {
  id: string;
  label: string;
  step2?: boolean;
  className?: string;
}

export function OnboardingField({
  id,
  label,
  step2 = false,
  className,
  style,
  ...props
}: OnboardingFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-normal"
        style={{ color: COLORS.GRAY_900 }}
      >
        {label}
      </label>
      <Input
        id={id}
        className={cn(
          "w-full rounded-lg px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2  placeholder:text-[#A0A0A0]",
          className
        )}
        style={{
          backgroundColor: ONBOARDING.INPUT_BG,
          borderColor: ONBOARDING.INPUT_BORDER,
          color: ONBOARDING.TEXT_TITLE,
          ...style,
        }}
        {...props}
      />
    </div>
  );
}
