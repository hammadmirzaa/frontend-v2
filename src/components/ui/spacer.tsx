"use client";

import { cn } from "@/lib/utils";

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  axis?: "x" | "y" | "both";
}

export function Spacer({
  size = 4,
  axis = "y",
  className,
  ...props
}: SpacerProps) {
  const sizeMap = {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
  };
  const value = sizeMap[size];

  const style =
    axis === "x"
      ? { width: value, minWidth: value }
      : axis === "y"
        ? { height: value, minHeight: value }
        : { width: value, minWidth: value, height: value, minHeight: value };

  const axisClasses = {
    x: "inline-block w-px shrink-0",
    y: "block h-px w-full shrink-0",
    both: "shrink-0",
  };

  return (
    <div
      aria-hidden
      className={cn(axisClasses[axis], className)}
      style={style}
      {...props}
    />
  );
}
