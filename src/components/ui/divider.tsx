"use client";

import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  label?: React.ReactNode;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)} {...props}>
        <hr
          aria-hidden
          className="flex-1 border-0 border-t border-secondary-200 dark:border-secondary-700"
        />
        <span className="text-sm text-muted-foreground">{label}</span>
        <hr
          aria-hidden
          className="flex-1 border-0 border-t border-secondary-200 dark:border-secondary-700"
        />
      </div>
    );
  }

  if (orientation === "vertical") {
    return (
      <hr
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "h-full w-px shrink-0 border-0 border-l border-secondary-200 dark:border-secondary-700",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={cn(
        "shrink-0 border-0 border-t border-secondary-200 dark:border-secondary-700",
        className
      )}
      {...props}
    />
  );
}
