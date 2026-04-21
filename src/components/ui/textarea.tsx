"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-gray-200 bg-input-bg px-3 py-2 text-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-secondary-700 dark:bg-secondary-900 dark:focus:ring-primary-400",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
