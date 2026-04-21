"use client";

interface ChevronIconProps {
  direction: "up" | "down";
  className?: string;
}

export function ChevronIcon({ direction, className }: ChevronIconProps) {
  const path = direction === "up" ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
