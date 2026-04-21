"use client";

import { ImageWrapper, Breadcrumbs } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";
import { LeadPill } from "./LeadPill";
import { EnvelopeIcon, PhoneIcon, BuildingIcon } from "./icons";
import { TABS } from "../constants";
import { STATUS_PILL, PRIORITY_PILL } from "../../constants";
import type { LeadRow } from "@/contexts/leads-context";
import { PLACEHOLDER_PHONE, PLACEHOLDER_LEAD_SCORE } from "../constants";

const BREADCRUMB_ITEMS = [
  { label: "Leads", href: "/leads" },
  { label: "Leads Details" },
];

export function LeadDetailHeader({
  lead,
  activeTab,
  onTabChange,
}: {
  lead: LeadRow;
  activeTab: string;
  onTabChange: (id: "overview" | "timeline" | "chatbot") => void;
}) {
  const statusStyle = STATUS_PILL[lead.status];
  const priorityStyle = PRIORITY_PILL[lead.priority];

  return (
    <>
      <Breadcrumbs items={BREADCRUMB_ITEMS} />

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-3 my-4">
        <ImageWrapper
          src="/svgs/leads/user3.svg"
          alt=""
          width={50}
          height={50}
        />

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1
            className="text-xl font-bold"
            style={{ color: COLORS.TEXT_TITLE }}
          >
            {lead.name}
          </h1>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <LeadPill bg={statusStyle.bg} text={statusStyle.text}>
          {lead.status}
        </LeadPill>
        <LeadPill bg={priorityStyle.bg} text={priorityStyle.text}>
          {lead.priority} Priority
        </LeadPill>
        <span
          className="inline-flex rounded-full pr-2.5 py-1 text-xs font-medium"
          style={{ color: COLORS.TEXT_TITLE }}
        >
          <ImageWrapper
            src="/svgs/leads/tag.svg"
            alt=""
            width={16}
            height={16}
            className="mr-1"
          />
          Lead Score: {PLACEHOLDER_LEAD_SCORE}
        </span>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-4 text-sm"
        style={{ color: COLORS.TEXT_BODY }}
      >
        <span className="flex items-center gap-1.5">
          <EnvelopeIcon
            className="h-4 w-4 shrink-0"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          {lead.email}
        </span>
        <span className="flex items-center gap-1.5">
          <PhoneIcon
            className="h-4 w-4 shrink-0"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          {PLACEHOLDER_PHONE}
        </span>
        <span className="flex items-center gap-1.5">
          <BuildingIcon
            className="h-4 w-4 shrink-0"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          {lead.company}
        </span>
      </div>

      <div
        className="mt-6 flex gap-6 border-t pt-4"
        style={{ borderColor: COLORS.CARD_BORDER }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="relative pb-1 text-sm font-medium transition-colors cursor-pointer"
            style={{
              color: activeTab === tab.id ? COLORS.BRAND : COLORS.TEXT_MUTED,
              fontWeight: activeTab === tab.id ? "bold" : "normal",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: COLORS.BRAND }}
              />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
