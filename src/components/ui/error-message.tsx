"use client";

import { cn } from "@/lib/utils";

export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

export function ErrorMessage({
  message,
  className,
  children,
  ...props
}: ErrorMessageProps) {
  const content = message ?? children;
  if (!content) return null;

  return (
    <p
      role="alert"
      className={cn(
        "mt-1.5 text-sm font-medium text-red-600 dark:text-red-400",
        className
      )}
      {...props}
    >
      {content}
    </p>
  );
}
