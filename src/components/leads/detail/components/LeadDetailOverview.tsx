"use client";

import { COLORS } from "@/lib/design-tokens";
import { STATUS_PILL, PRIORITY_PILL } from "../../constants";
import { MOCK_NOTE, MOCK_ACTIVITIES, PLACEHOLDER_PHONE, PLACEHOLDER_POSITION, PLACEHOLDER_LOCATION } from "../constants";
import type { LeadRow } from "@/contexts/leads-context";
import { DetailCard } from "./DetailCard";
import { InfoGridRow } from "./InfoGridRow";
import { LeadPill } from "./LeadPill";
import { PhoneIcon, EnvelopeIcon, VideoIcon, PencilIcon } from "./icons";
import { ImageWrapper } from "@/components/ui";

export function LeadDetailOverview({ lead }: { lead: LeadRow }) {
  const statusStyle = STATUS_PILL[lead.status];
  const priorityStyle = PRIORITY_PILL[lead.priority];
  const statusPill = <LeadPill bg={statusStyle.bg} text={statusStyle.text}>{lead.status}</LeadPill>;
  const priorityPill = <LeadPill bg={priorityStyle.bg} text={priorityStyle.text}>{lead.priority}</LeadPill>;

  return (
    <>
      <DetailCard>
        <div className="flex items-center justify-between  px-6 py-4" style={{ borderColor: COLORS.CARD_BORDER }}>
          <h2 className="text-base font-bold" style={{ color: COLORS.TEXT_TITLE }}>Lead Information</h2>
          <button type="button" className="rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Edit">
            <ImageWrapper src="/svgs/leads/pencil.svg" alt="" width={20} height={20} />
          </button>
        </div>
        <div className="grid gap-4 px-6 pb-4 sm:grid-cols-2">
          <InfoGridRow label="Full Name" value={lead.name} />
          <InfoGridRow label="Email" value={lead.email} />
          <InfoGridRow label="Phone" value={PLACEHOLDER_PHONE} />
          <InfoGridRow label="Company" value={lead.company} />
          <InfoGridRow label="Position" value={PLACEHOLDER_POSITION} />
          <InfoGridRow label="Location" value={PLACEHOLDER_LOCATION} />
          <InfoGridRow label="Lead Source" value={lead.source} />
          <InfoGridRow label="Lead Status" children={statusPill} />
          <InfoGridRow label="Lead Priority" children={priorityPill} />
        </div>
      </DetailCard>

      <DetailCard>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderColor: COLORS.CARD_BORDER }}>
          <h2 className="text-base font-bold" style={{ color: COLORS.TEXT_TITLE }}>Notes</h2>
          <ImageWrapper src="/svgs/leads/plus-circle.svg" alt="" width={20} height={20} />
        </div>
        <div className="px-6 pb-4">
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.GRAY_50 }}>
            <p className="text-sm" style={{ color: COLORS.TEXT_BODY }}>{MOCK_NOTE.body}</p>
            <p className="mt-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>{MOCK_NOTE.author} • {MOCK_NOTE.time}</p>
          </div>
        </div>
      </DetailCard>

      <DetailCard>
        <div className="px-6 py-4" style={{ borderColor: COLORS.CARD_BORDER }}>
          <h2 className="text-base font-bold" style={{ color: COLORS.TEXT_TITLE }}>Recent Activity</h2>
        </div>
        <div className="px-6 pb-4">
          <ul className="space-y-4">
            {MOCK_ACTIVITIES.map((a, i) => (
              <li key={i} className="flex gap-4">
                <div >
                  {a.icon === "phone" && <ImageWrapper src="/svgs/leads/follow-up-call.svg" alt="" width={36} height={36} />}
                  {a.icon === "envelope" && <ImageWrapper src="/svgs/leads/send-proposal.svg" alt="" width={36} height={36} />}
                  {a.icon === "video" && <ImageWrapper src="/svgs/leads/demo-meeting.svg" alt="" width={36} height={36} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: COLORS.TEXT_TITLE }}>{a.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: COLORS.TEXT_MUTED }}>{a.desc}</p>
                  <p className="mt-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}>{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-4 w-full text-center text-sm font-bold hover:underline" style={{ color: COLORS.BRAND }}>View All Activities</button>
        </div>
      </DetailCard>
    </>
  );
}
