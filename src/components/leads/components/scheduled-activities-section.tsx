"use client";

import { useState } from "react";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "@/components/ui";
import { shadows } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const TABS = ["Today", "Upcoming", "Overdue"] as const;

const MOCK_ACTIVITIES = [
  {
    id: "1",
    title: "Follow-up Call",
    person: "Sarah Johnson",
    company: "TechCorp Inc.",
    time: "10:00 AM",
    status: "today" as const,
    icon: "follow-up-call",
  },
  {
    id: "2",
    title: "Product Demo",
    person: "Mike Chen",
    company: "Acme Ltd",
    time: "2:30 PM",
    status: "today" as const, 
    icon: "product-demo",
  },
  {
    id: "3",
    title: "Send Proposal",
    person: "Emma Wilson",
    company: "Global Solutions",
    time: "9:00 AM",
    status: "overdue" as const,
    icon: "send-proposal",
  },
  {
    id: "4",
    title: "Contract Review",
    person: "James Brown",
    company: "StartupXYZ",
    time: "3:00 PM",
    status: "upcoming" as const,
    date: "Jan 20",
    icon: "contract-review",
  },
];

const ACTIVITY_ICON_BGS = [
  COLORS.ACTIVITY_ICON_BG_BLUE,
  COLORS.ACTIVITY_ICON_BG_PURPLE,
  COLORS.ACTIVITY_ICON_BG_GREEN,
  COLORS.ACTIVITY_ICON_BG_YELLOW,
] as const;

export function ScheduledActivitiesSection() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Today");

  return (
    <div
      className="rounded-xl bg-white p-6"
      style={{  borderWidth: "0.5px", borderColor: COLORS.GRAY_100 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3
          className="text-lg font-bold"
          style={{ color: COLORS.TEXT_TITLE }}
        >
          Scheduled Activities
        </h3>
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-4 py-1 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "text-white"
                  : "bg-white border hover:bg-gray-200"
              )}
              style={
                activeTab === tab
                  ? { backgroundColor: COLORS.BRAND }
                  : { color: COLORS.CARD_TEXT_COLOR, borderColor: COLORS.CARD_BORDER }
              }
            >
              {tab}
            </button>
          ))}
            <ImageWrapper src="/svgs/leads/activity-calendar.svg" alt="" width={20} height={20} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_ACTIVITIES.map((activity, i) => (
          <div
            key={activity.id}
            className="flex gap-4 rounded-xl border p-4 transition-colors hover:bg-gray-50"
            style={{
              borderColor: COLORS.GRAY_100,
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl "
              style={{ backgroundColor: ACTIVITY_ICON_BGS[i % 4] }}
            >
              <ImageWrapper src={`/svgs/leads/${activity.icon}.svg`} alt="" width={44} height={44} />
            </div>
            <div className="min-w-0 flex-1">
              <p className=" text-sm font-semibold" style={{ color: COLORS.TEXT_TITLE }}>
                {activity.title}
              </p>
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {activity.person} • {activity.company}
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                <ImageWrapper src="/svgs/leads/timer.svg" alt="" width={14} height={14} />
                {activity.time}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div
                className="text-2xl flex items-start "
                style={{
                  color:
                    activity.status === "today"
                      ? COLORS.SUCCESS
                      : activity.status === "overdue"
                        ? COLORS.DANGER
                        : COLORS.TEXT_MUTED,
                }}
              >
                •
              </div>
              {activity.status === "today" && (
                <span className="text-xs font-bold" style={{ color: COLORS.SUCCESS }}>
                  Today
                </span>
              )}
              {activity.status === "overdue" && (
                <span className="text-xs font-bold" style={{ color: COLORS.DANGER }}>
                  Overdue
                </span>
              )}
              {activity.status === "upcoming" && activity.date && (
                <span className="text-xs font-bold " style={{ color: COLORS.TEXT_MUTED }}>
                  {activity.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
