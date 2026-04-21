"use client";

import { Button, ImageWrapper, ModalRoot, ModalTrigger } from "@/components/ui";
import { COLORS, shadows } from "@/lib/design-tokens";
import { TIMELINE_FILTERS, MOCK_TIMELINE_ACTIVITIES, ACTIVITY_STATUS_PILL, TIMELINE_FILTER_TO_TYPE } from "../constants";
import { AddActivityModalContent } from "../modals";
import { DetailCard } from "./DetailCard";
import { PhoneIcon, EnvelopeIcon, VideoIcon, DocumentIcon } from "./icons";

const ICON_MAP = { phone: PhoneIcon, envelope: EnvelopeIcon, video: VideoIcon, document: DocumentIcon } as const;

export function LeadDetailTimeline({ timelineFilter, setTimelineFilter }: { timelineFilter: string; setTimelineFilter: (id: "all" | "calls" | "emails" | "meetings" | "notes") => void }) {
  const filtered = MOCK_TIMELINE_ACTIVITIES.filter((a) => (timelineFilter === "all" ? true : a.type === TIMELINE_FILTER_TO_TYPE[timelineFilter]));

  return (
    <DetailCard className="px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold" style={{ color: COLORS.TEXT_TITLE }}>Activity Timeline</h2>
        <ModalRoot>
          <ModalTrigger asChild>
            <Button type="button" className="w-full shrink-0 sm:w-auto cursor-pointer" style={{ backgroundColor: COLORS.BRAND }}>
              <span className="mr-1.5">+</span> Add Activity
            </Button>
          </ModalTrigger>
          <AddActivityModalContent />
        </ModalRoot>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {TIMELINE_FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setTimelineFilter(f.id)} className="rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            style={timelineFilter === f.id ? { backgroundColor: COLORS.BRAND_ACTIVE_BG, color: COLORS.BRAND_TITLE, fontWeight: "bold" } : { backgroundColor: COLORS.WHITE, color: COLORS.TEXT_BODY, border: `1px solid ${COLORS.CARD_BORDER}` }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="relative mt-8">
        <div className="absolute left-5 top-2 bottom-2 w-px" style={{ backgroundColor: COLORS.CARD_BORDER }} />
        <ul className="space-y-0">
          {filtered.map((a, i) => {
            const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
            return (
              <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
                <div>
                  {a.icon === "phone" && <ImageWrapper src="/svgs/leads/follow-up-call.svg" alt="" width={36} height={36} className="rounded-full" />}
                  {a.icon === "envelope" && <ImageWrapper src="/svgs/leads/send-proposal.svg" alt="" width={36} height={36} className="rounded-full" />}
                  {a.icon === "video" && <ImageWrapper src="/svgs/leads/demo-meeting.svg" alt="" width={36} height={36} className="rounded-full" />}
                  {a.icon === "document" && <ImageWrapper src="/svgs/leads/document.svg" alt="" width={36} height={36} />}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border p-4" style={{ borderColor: COLORS.CARD_BORDER, boxShadow: shadows.sm, backgroundColor: COLORS.WHITE }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: COLORS.TEXT_TITLE }}>{a.title}</p>
                    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={{ backgroundColor: ACTIVITY_STATUS_PILL[a.status].bg, color: ACTIVITY_STATUS_PILL[a.status].text }}>{a.status}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}>{a.time} • by {a.by}</p>
                  <p className="mt-2 text-xs" style={{ color: COLORS.TEXT_BODY }}>{a.desc}</p>
                  <hr className="my-3" style={{ borderColor: COLORS.CARD_BORDER_LIGHT }} />
                  <button type="button" className=" text-sm font-bold hover:underline cursor-pointer" style={{ color: COLORS.BRAND }}>View Details</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </DetailCard>
  );
}
