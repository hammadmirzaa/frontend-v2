"use client";

import { COLORS } from "@/lib/design-tokens";
import type { LeadRow } from "@/contexts/leads-context";

export interface LeadsStatsCardsProps {
  leads: LeadRow[];
}

function EllipsisIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: COLORS.ICON_ELLIPSIS }}>
      <circle cx="4" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="12" cy="8" r="1.25" fill="currentColor" />
    </svg>
  );
}

/** Reusable metric card with title, value, and ellipsis menu (e.g. Leads, Follow Ups). */
export function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div
      className="rounded-xl bg-white p-4 "
      style={{ borderWidth: "0.5px", borderColor: COLORS.GRAY_100 }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>
          {title}
        </p>
        <button
          type="button"
          className="flex h-8 w-8 items-start justify-center rounded-lg cursor-pointer"
          aria-label="Options"
        >
          <EllipsisIcon />
        </button>
      </div>
      <p className="mt-1 text-3xl font-bold" style={{ color: COLORS.TEXT_TITLE }}>
        {value}
      </p>
    </div>
  );
}

export function LeadsStatsCards({ leads }: LeadsStatsCardsProps) {
  const qualified = leads.filter((l) => l.status === "qualified").length;
  const conversionRate =
    leads.length > 0 ? Math.round((qualified / leads.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Leads" value={leads.length} />
      <StatCard title="Qualified" value={qualified} />
      <StatCard title="Conversion Rate" value={`${conversionRate}%`} />
      <StatCard title="Activities" value={0} />
    </div>
  );
}
