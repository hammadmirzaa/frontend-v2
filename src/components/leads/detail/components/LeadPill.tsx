"use client";

export function LeadPill({
  bg,
  text,
  children,
  className = "",
}: {
  bg: string;
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}
