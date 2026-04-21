"use client";

import { Button, ImageWrapper, ModalRoot, ModalTrigger } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";
import { LEAD_OWNER } from "../constants";
import type { LeadRow } from "@/contexts/leads-context";
import { DetailCard } from "./DetailCard";
import { PhoneIcon, EnvelopeIcon, VideoIcon } from "./icons";
import {
  AddActivityModalContent,
  ScheduleCallModalContent,
  SendEmailModalContent,
  ScheduleMeetingModalContent,
} from "../modals";

const headerStyle = { borderColor: COLORS.CARD_BORDER };
const sectionClass = "px-6 py-4";

const QUICK_ACTIONS = [
  { label: "Schedule Call", Icon: PhoneIcon, primary: true, Content: ScheduleCallModalContent },
  { label: "Send Email", Icon: EnvelopeIcon, primary: false, Content: SendEmailModalContent },
  { label: "Schedule Meeting", Icon: VideoIcon, primary: false, Content: ScheduleMeetingModalContent },
  { label: "Add Activity", Icon: () => <span className="text-lg">+</span>, primary: false, Content: AddActivityModalContent },
] as const;

export function LeadDetailSidebar({ lead, removeLead }: { lead: LeadRow; removeLead: (id: string) => void }) {
  return (
    <div className="w-full space-y-6 lg:w-80 lg:shrink-0">
      <DetailCard>
        <div className={sectionClass} style={headerStyle}>
          <h2 className="text-base font-bold" style={{ color: COLORS.TEXT_TITLE }}>Quick Actions</h2>
        </div>
        <div className="flex flex-col gap-2 px-6 pb-4">
          {QUICK_ACTIONS.map(({ label, Icon, primary, Content }) => (
            <ModalRoot key={label}>
              <ModalTrigger asChild>
                <Button
                  type="button"
                  variant={primary ? undefined : "outline"}
                  className="w-full justify-start gap-2 rounded-lg text-xs font-semibold cursor-pointer"
                  style={primary ? { backgroundColor: COLORS.BRAND, color: COLORS.WHITE } : undefined}
                >
                  <Icon className="h-4 w-4" style={primary ? { color: COLORS.WHITE } : undefined} /> {label}
                </Button>
              </ModalTrigger>
              <Content />
            </ModalRoot>
          ))}
        </div>
      </DetailCard>

      <DetailCard>
        <div className={sectionClass} style={headerStyle}>
          <h2 className="text-base font-bold" style={{ color: COLORS.TEXT_TITLE }}>Lead Owner</h2>
        </div>
        <div className="flex items-center gap-4 px-6 pb-4">
          <ImageWrapper src="/svgs/leads/user3.svg" alt="" width={36} height={36} />
          <div>
            <p className="text-medium font-medium" style={{ color: COLORS.TEXT_TITLE }}>{LEAD_OWNER.name}</p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{LEAD_OWNER.title}</p>
          </div>
        </div>
      </DetailCard>
    </div>
  );
}
