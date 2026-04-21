"use client";

import { COLORS, shadows } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DetailCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl bg-white", className)}
      style={{  border: `1px solid ${COLORS.GRAY_200}` }}
    >
      {children}
    </div>
  );
}
