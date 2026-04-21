"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, MessageSquare, Clock, Send, Calendar, MoreVertical, ClipboardList, X } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { SearchInput } from "@/components/layout/search-input";
import { StatCard } from "@/components/leads";
import { ScheduleFollowUpModalContent } from "@/components/leads/detail/modals";
import {
  FollowUpsFilterPanel,
  DEFAULT_FOLLOW_UPS_FILTERS,
  type FollowUpsFilters,
} from "./follow-ups-filter-panel";
import { Button, COLORS, ImageWrapper, ModalRoot, ModalTrigger, Pagination, zIndex } from "@/components/ui";
import { cn } from "@/lib/utils";

const STAT_CARDS = [
  { title: "On-Time Send Rate", value: "87%" },
  { title: "Automation Coverage", value: "8%" },
  { title: "Overdue Rate", value: "13%" },
  { title: "Failure Rate", value: "25%" },
  { title: "Reschedule Rate", value: "4%" },
  { title: "Send Success Rate", value: "4%" },
];

const STATUS_TABS = [
  { id: "due-now", label: "Due now", count: 22, dotColor: "#D97706", bgColor: "#FFFBEB" },
  { id: "overdue", label: "Overdue", count: 11, dotColor: "#DC2626", bgColor: "#FEF2F2" },
  { id: "scheduled", label: "Scheduled", count: 45, dotColor: "#2563EB", bgColor: "#EFF6FF" },
  { id: "sent", label: "Sent", count: 78, dotColor: "#16A34A", bgColor: "#F2FFF6" },
  { id: "rescheduled", label: "Rescheduled", count: 23, dotColor: "#9333EA", bgColor: "#FAF5FF" },
  { id: "failed", label: "Failed", count: 8, dotColor: "#DC2626", bgColor: "#FEF2F2" },
] as const;

const FOLLOW_UP_ITEMS = [
  { id: 1, leadName: "Robert Taylor", email: "robert.t@business.com", statusTag: "Due Now", activityType: "Email", chatbotName: "Chatbot Name", dueTime: "Today at 2:15 PM" },
  { id: 2, leadName: "Sarah Chen", email: "sarah.chen@acme.com", statusTag: "Scheduled", activityType: "Email", chatbotName: "Welcome Bot", dueTime: "Tomorrow at 10:00 AM" },
  { id: 3, leadName: "Mike Johnson", email: "mike.j@company.io", statusTag: "Due Now", activityType: "Email", chatbotName: "Follow-up Bot", dueTime: "Today at 4:30 PM" },
  { id: 4, leadName: "Emma Wilson", email: "emma.w@startup.co", statusTag: "Overdue", activityType: "Email", chatbotName: "Chatbot Name", dueTime: "Yesterday at 9:00 AM" },
];

export function FollowUpsContent() {
  const [activeTab, setActiveTab] = useState<string>(STATUS_TABS[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FollowUpsFilters>(DEFAULT_FOLLOW_UPS_FILTERS);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const totalPages = 6;

  useEffect(() => {
    if (openMenuId === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuWrapRef.current?.contains(e.target as Node)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuId]);

  return (
    <AppLayout title="Follow Ups" className="bg-page-bg">
      <div className="space-y-6">
        {/* 6 stat cards – 2 rows x 3, gap-x 12px gap-y 16px per design */}
        <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>

        {/* Main card */}
        <div
          className="overflow-hidden rounded-xl bg-white shadow-sm"
          style={{ borderWidth: "0.5px", borderColor: COLORS.CARD_BORDER }}
        >
          <div className="p-6">
            {/* Title and description */}
            <div className="mb-6">
              <h1
                className="text-lg font-bold md:text-2xl"
                style={{ color: COLORS.TEXT_TITLE }}
              >
                All Follow Ups
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Schedule, track, and automate follow-ups to convert leads faster.
              </p>
            </div>

            {/* Search, Filters button, Schedule Follow Up button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1">
                <SearchInput
                  placeholder="Search follow-ups by lead name, email, type, or date..."
                  inputClassName="h-12 rounded-xl border-0 bg-search-bg placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-gray-200"
                  className="max-w-full"
                />
              </div>
              <div className="relative" style={{ zIndex: zIndex.dropdown }}>
                <button
                  ref={filtersButtonRef}
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 cursor-pointer"
                  style={{ borderColor: COLORS.CARD_BORDER, color: COLORS.TEXT_TITLE }}
                >
                  <ImageWrapper src="/svgs/filter.svg" alt="" width={18} height={18} />
                  <span>Filters</span>
                  <ImageWrapper src="/svgs/chevron-down.svg" alt="" width={18} height={18} />
                </button>
                <FollowUpsFilterPanel
                  open={filtersOpen}
                  onClose={() => setFiltersOpen(false)}
                  anchorRef={filtersButtonRef}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClear={() => setFilters(DEFAULT_FOLLOW_UPS_FILTERS)}
                  onApply={() => {}}
                />
              </div>
              <ModalRoot>
                <ModalTrigger asChild>
                  <Button
                    className="h-12 shrink-0 whitespace-nowrap cursor-pointer"
                    style={{ backgroundColor: COLORS.BRAND }}
                  >
                    Schedule Follow Up
                  </Button>
                </ModalTrigger>
                <ScheduleFollowUpModalContent />
              </ModalRoot>
            </div>

            {/* Status tabs – label + badge (dot + count), active has purple underline */}
            <div className="mt-8 flex flex-wrap gap-0 border-b border-card-border w-full justify-between text-center">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 border-b-2 pb-3 pt-1 px-4 text-sm font-normal transition-colors",
                    activeTab === tab.id
                      ? "border-brand text-title"
                      : "border-transparent text-body hover:text-title"
                  )}
                  style={
                    activeTab === tab.id
                      ? { borderBottomColor: COLORS.BRAND }
                      : undefined
                  }
                >
                  <span className="truncate">{tab.label}</span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: tab.bgColor,
                      color: tab.dotColor,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tab.dotColor }}
                    />
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* List of follow-up cards – lead info, activity details, Send Now / Reschedule / ellipsis */}
            <div className="mt-6 space-y-4">
              {FOLLOW_UP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white p-6"
                  style={{
                    borderWidth: "1px",
                    borderColor: COLORS.CARD_BORDER,
                  }}
                >
                  {/* Top: lead name + status tag */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: COLORS.TEXT_TITLE }}
                      >
                        {item.leadName}
                      </h3>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {item.email}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: COLORS.BRAND_ACTIVE_BG,
                        color: COLORS.BRAND_TITLE,
                      }}
                    >
                      {item.statusTag}
                    </span>
                  </div>

                  {/* Middle: activity row – icon+label · icon+label · icon+time */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: COLORS.TEXT_BODY }}>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4 shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                      {item.activityType}
                    </span>
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: COLORS.TEXT_MUTED }} aria-hidden />
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                      {item.chatbotName}
                    </span>
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: COLORS.TEXT_MUTED }} aria-hidden />
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                      {item.dueTime}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg px-4 cursor-pointer "
                      style={{ backgroundColor: COLORS.BRAND }}
                    >
                      <Send className="h-4 w-4" />
                      Send Now
                    </Button>
                    <ModalRoot>
                      <ModalTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1.5 rounded-lg border px-4 bg-brand-active text-brand hover:bg-brand-active/80 border-transparent cursor-pointer "
                        >
                          <Calendar className="h-4 w-4" style={{ color: COLORS.BRAND }} />
                          <span style={{ color: COLORS.BLACK }}>Reschedule</span>
                        </Button>
                      </ModalTrigger>
                      <ScheduleFollowUpModalContent
                        leadOptions={FOLLOW_UP_ITEMS.map((i) => ({ id: String(i.id), name: i.leadName }))}
                        defaultLeadId={String(item.id)}
                      />
                    </ModalRoot>
                    <div
                      ref={openMenuId === item.id ? menuWrapRef : undefined}
                      className="relative ml-1"
                      style={{ zIndex: openMenuId === item.id ? zIndex.dropdown : undefined }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-gray-100 cursor-pointer"
                        aria-label="More options"
                        aria-expanded={openMenuId === item.id}
                      >
                        <MoreVertical className="h-5 w-5" style={{ color: COLORS.TEXT_TITLE }} />
                      </button>
                      {openMenuId === item.id && (
                        <div
                          className="absolute right-0 top-full mt-1 min-w-[180px] rounded-xl border bg-white py-1.5 shadow-lg"
                          style={{ borderColor: COLORS.CARD_BORDER }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              // View details – e.g. navigate or open detail
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 first:rounded-t-xl cursor-pointer "
                            style={{ color: COLORS.TEXT_TITLE }}
                          >
                            <ClipboardList className="h-5 w-5 shrink-0" style={{ color: COLORS.BRAND }} />
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              // Cancel follow-up
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 last:rounded-b-xl cursor-pointer "
                            style={{ color: COLORS.TEXT_TITLE }}
                          >
                            <X className="h-5 w-5 shrink-0" style={{ color: COLORS.BRAND }} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination – Page X of Y left, then Previous, page numbers (01, 02, …), Next */}
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
