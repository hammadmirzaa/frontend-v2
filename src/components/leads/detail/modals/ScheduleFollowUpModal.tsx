"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Phone, Mail, MessageSquare, Bold, Italic, Underline, Paperclip, ImageIcon, Smile } from "lucide-react";
import {
  ModalContent,
  useModalContext,
  FormField,
  ListDropdown,
  Input,
  Textarea,
  Button,
  COLORS,
} from "@/components/ui";
import { LeadModalHeader } from "./LeadModalShell";
import { DatePickerField } from "./DatePickerField";
import { TimePickerField } from "./TimePickerField";
import { SCHEDULE_FOLLOW_UP, FOLLOW_UP_TYPE_OPTIONS } from "./constants";
import { cn } from "@/lib/utils";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const BODY_CLASS = "px-6 py-4 space-y-4";
const INPUT_CLASS = "h-11 rounded-lg border w-full";
const FOOTER_CLASS = "flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end";

export interface ScheduleFollowUpModalContentProps {
  /** Optional list of leads for the dropdown. When not provided, uses placeholder options. */
  leadOptions?: { id: string; name: string }[];
  /** Optional pre-selected lead id (e.g. when opened from lead detail). */
  defaultLeadId?: string;
}

const DEFAULT_LEAD_OPTIONS = [
  { id: "1", name: "Robert Taylor" },
  { id: "2", name: "Sarah Chen" },
  { id: "3", name: "Mike Johnson" },
  { id: "4", name: "Emma Wilson" },
];

export function ScheduleFollowUpModalContent({
  leadOptions = DEFAULT_LEAD_OPTIONS,
  defaultLeadId = "",
}: ScheduleFollowUpModalContentProps) {
  const { close } = useModalContext();
  const [leadId, setLeadId] = useState(defaultLeadId);
  const [followUpType, setFollowUpType] = useState<string>("call");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessageEmpty, setEmailMessageEmpty] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const emailEditorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    close();
  };

  const handleCallNow = () => {
    close();
  };

  const inputBorderStyle = { borderColor: COLORS.CARD_BORDER };

  const isEmailType = followUpType === "email" || followUpType === "email-sms";

  const doFormat = (cmd: string) => {
    emailEditorRef.current?.focus();
    document.execCommand(cmd, false);
    setEmailMessageEmpty(!emailEditorRef.current?.innerText?.trim());
  };

  const doInsertEmoji = (emoji: string) => {
    emailEditorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    setEmailMessageEmpty(false);
    setShowEmoji(false);
  };

  const typeIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-5 w-5" style={{ color: COLORS.TEXT_SUBTITLE }} />,
    email: <Mail className="h-5 w-5" style={{ color: COLORS.TEXT_SUBTITLE }} />,
    sms: <MessageSquare className="h-5 w-5" style={{ color: COLORS.TEXT_SUBTITLE }} />,
    "email-sms": (
      <span className="inline-flex items-center gap-0.5">
        <Mail className="h-4 w-4" style={{ color: COLORS.TEXT_SUBTITLE }} />
        <MessageSquare className="h-4 w-4" style={{ color: COLORS.TEXT_SUBTITLE }} />
      </span>
    ),
  };

  return (
    <ModalContent
      className="rounded-xl max-w-lg"
      style={{ borderColor: COLORS.CARD_BORDER }}
    >
      <LeadModalHeader
        title={SCHEDULE_FOLLOW_UP.TITLE}
        subtitle={SCHEDULE_FOLLOW_UP.SUBTITLE}
        dividerColor="#E9EAEB"
      />
      <div className={BODY_CLASS}>
        <FormField id="schedule-followup-lead" label={SCHEDULE_FOLLOW_UP.LEAD_LABEL} required>
          <ListDropdown
            id="schedule-followup-lead"
            options={leadOptions.map((lead) => ({ value: lead.id, label: lead.name }))}
            value={leadId}
            onChange={setLeadId}
            placeholder={SCHEDULE_FOLLOW_UP.LEAD_PLACEHOLDER}
            className={cn(INPUT_CLASS, "h-11 cursor-pointer")}
          />
        </FormField>

        <FormField id="schedule-followup-type" label={SCHEDULE_FOLLOW_UP.TYPE_LABEL} required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FOLLOW_UP_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFollowUpType(opt.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  followUpType === opt.value
                    ? "border-brand bg-brand-active"
                    : "border-card-border bg-white hover:bg-gray-50"
                )}
                style={
                  followUpType === opt.value
                    ? { borderColor: COLORS.BRAND, backgroundColor: COLORS.BRAND_ACTIVE_BG }
                    : { borderColor: COLORS.CARD_BORDER }
                }
              >
                {typeIcons[opt.value]}
                <span style={{ color: followUpType === opt.value ? COLORS.BRAND_TITLE : COLORS.TEXT_TITLE }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </FormField>

        <FormField id="schedule-followup-datetime" label={SCHEDULE_FOLLOW_UP.DATE_TIME_LABEL} required>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePickerField
              id="schedule-followup-date"
              value={date}
              onChange={setDate}
              placeholder={SCHEDULE_FOLLOW_UP.DATE_PLACEHOLDER}
              style={inputBorderStyle}
            />
            <TimePickerField
              id="schedule-followup-time"
              value={time}
              onChange={setTime}
              placeholder={SCHEDULE_FOLLOW_UP.TIME_PLACEHOLDER}
              style={inputBorderStyle}
            />
          </div>
        </FormField>

        {isEmailType ? (
          <>
            <FormField id="schedule-followup-email-subject" label={SCHEDULE_FOLLOW_UP.EMAIL_SUBJECT_LABEL}>
              <Input
                id="schedule-followup-email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={SCHEDULE_FOLLOW_UP.EMAIL_SUBJECT_PLACEHOLDER}
                className={INPUT_CLASS}
                style={inputBorderStyle}
              />
            </FormField>
            <FormField id="schedule-followup-email-message" label={SCHEDULE_FOLLOW_UP.EMAIL_MESSAGE_LABEL}>
              <div className="rounded-lg border overflow-visible" style={{ borderColor: COLORS.CARD_BORDER }}>
                <div className="relative min-h-[120px]">
                  <div
                    ref={emailEditorRef}
                    contentEditable
                    onInput={() => setEmailMessageEmpty(!emailEditorRef.current?.innerText?.trim())}
                    className="min-h-[120px] w-full px-3 py-3 text-sm outline-none"
                    style={{ color: COLORS.TEXT_BODY }}
                  />
                  {emailMessageEmpty && (
                    <span className="absolute left-3 top-3 text-sm pointer-events-none text-gray-400">
                      {SCHEDULE_FOLLOW_UP.EMAIL_MESSAGE_PLACEHOLDER}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center gap-0 border-t py-2 px-2" style={{ borderColor: COLORS.CARD_BORDER_LIGHT }}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("bold")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Bold">
                    <Bold className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("italic")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Italic">
                    <Italic className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("underline")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Underline">
                    <Underline className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-0.5" />
                  <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Attachment">
                    <Paperclip className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Image">
                    <ImageIcon className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className={cn("p-1.5 rounded hover:bg-gray-100 text-gray-700", showEmoji && "bg-purple-50 border border-purple-200")}
                    aria-label="Emoji"
                  >
                    <Smile className="h-4 w-4" strokeWidth={2} />
                  </button>
                  {showEmoji && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 rounded-lg border border-gray-200 shadow-lg bg-white">
                      <EmojiPicker onEmojiClick={(e) => doInsertEmoji(e.emoji)} width={300} height={360} previewConfig={{ showPreview: false }} />
                    </div>
                  )}
                </div>
              </div>
            </FormField>
          </>
        ) : (
          <FormField id="schedule-followup-message" label={SCHEDULE_FOLLOW_UP.MESSAGE_LABEL}>
            <Textarea
              id="schedule-followup-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={SCHEDULE_FOLLOW_UP.MESSAGE_PLACEHOLDER}
              rows={4}
              className="w-full min-h-[80px] resize-none rounded-lg border"
              style={inputBorderStyle}
            />
          </FormField>
        )}
      </div>

      <div className={FOOTER_CLASS} style={{ borderColor: COLORS.CARD_BORDER }}>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          style={{ borderColor: COLORS.CARD_BORDER, color: COLORS.TEXT_TITLE }}
          onClick={close}
        >
          {SCHEDULE_FOLLOW_UP.CANCEL}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE }}
          onClick={isEmailType ? handleSubmit : handleCallNow}
        >
          {isEmailType ? SCHEDULE_FOLLOW_UP.SEND_NOW : SCHEDULE_FOLLOW_UP.CALL_NOW}
        </Button>
        <Button
          type="button"
          className="rounded-lg text-white"
          style={{ backgroundColor: COLORS.BRAND }}
          onClick={handleSubmit}
        >
          {SCHEDULE_FOLLOW_UP.SUBMIT}
        </Button>
      </div>
    </ModalContent>
  );
}
