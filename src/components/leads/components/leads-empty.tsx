"use client";

import { ImageWrapper } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

const FEATURE_CALLOUTS = [
  {
    id: "track",
    title: "Track Progress",
    description: "Monitor lead status from initial contact to closed deal.",
    iconBg: COLORS.CALLOUT_ICON_BG_1,
    iconBorder: COLORS.CALLOUT_ICON_BORDER_1,
    iconSlot: "track2",
  },
  {
    id: "schedule",
    title: "Schedule Activities",
    description: "Plan follow-ups and never miss a touchpoint.",
    iconBg: COLORS.CALLOUT_ICON_BG_2,
    iconBorder: COLORS.CALLOUT_ICON_BORDER_2,
    iconSlot: "schedule2",
  },
  {
    id: "analyze",
    title: "Analyze Data",
    description: "Get insights on conversion and pipeline health.",
    iconBg: COLORS.CALLOUT_ICON_BG_3,
    iconBorder: COLORS.CALLOUT_ICON_BORDER_3,
    iconSlot: "analyze2",
  },
] as const;

export interface LeadsEmptyProps {
  className?: string;
}

/** Placeholder for main empty state icon (person + plus). Replace with your own icon. */
function EmptyStateIconSlot() {
  return (
    <ImageWrapper src="/svgs/user2.svg" alt="Leads Empty" width={64} height={64} />
  );
}

/** Placeholder for feature callout icon. Replace with your own icon. */
function CalloutIconSlot({
  iconBg,
  iconBorder,
  slotName,
}: {
  iconBg: string;
  iconBorder: string;
  slotName: string;
}) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
      style={{
        backgroundColor: iconBg,
        borderWidth: "1px",
        borderColor: iconBorder,
      }}
      aria-hidden
      data-icon-slot={slotName}
    >
      {/* Replace with your icon */}
    </div>
  );
}

export function LeadsEmpty({ className }: LeadsEmptyProps) {
  return (
    <div
      className={`flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center ${className ?? ""}`}
    >
      <EmptyStateIconSlot />
      <h3 className="mt-4 text-xl font-bold" style={{ color: COLORS.TEXT_TITLE }}>
        No Leads Yet
      </h3>
      <p
        className="mt-2 max-w-md text-sm leading-relaxed"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        Start building your sales pipeline by adding your first lead. Track
        prospects, manage activities, and close more deals.
      </p>

      <hr className=" border-gray-300 h-1 w-2xl my-8 " />

      <div className=" grid w-full max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURE_CALLOUTS.map((callout) => (
          <div
            key={callout.id}
            className="flex flex-col items-center text-center"
          >
            <ImageWrapper src={`/svgs/${callout.iconSlot}.svg`} alt={callout.title} width={48} height={48} />
            <h4
              className="mt-3 text-sm font-bold"
              style={{ color: COLORS.TEXT_TITLE }}
            >
              {callout.title}
            </h4>
            <p
              className="mt-1 text-xs leading-snug"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              {callout.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
