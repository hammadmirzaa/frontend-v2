"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        className={cn(
          "h-4 w-4 rounded-full border-secondary-300 text-primary-600 transition-colors",
          "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-secondary-600 dark:bg-secondary-800",
          className
        )}
        {...props}
      />
    );
  }
);

Radio.displayName = "Radio";
