"use client";

import { COLORS } from "@/lib/design-tokens";

export function InfoGridRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold capitalize tracking-wide" style={{ color: COLORS.TEXT_MUTED }}>
        {label}
      </p>
      {children ?? (
        <p className="text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}
