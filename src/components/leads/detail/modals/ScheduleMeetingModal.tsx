"use client";

import { useState } from "react";
import { ModalContent, useModalContext, FormField, Input, Select, Textarea, Checkbox, Label } from "@/components/ui";
import { LeadModalHeader, LeadModalFooter } from "./LeadModalShell";
import { DatePickerField } from "./DatePickerField";
import { TimePickerField } from "./TimePickerField";
import { SCHEDULE_MEETING, MEETING_TYPE_OPTIONS } from "./constants";
import { COLORS } from "@/lib/design-tokens";

const borderStyle = { borderColor: COLORS.CARD_BORDER };
const inputClass = "h-11 rounded-lg border w-full";

export function ScheduleMeetingModalContent() {
  const { close } = useModalContext();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingType, setMeetingType] = useState("video");
  const [link, setLink] = useState("");
  const [agenda, setAgenda] = useState("");
  const [addToCalendar, setAddToCalendar] = useState(false);

  function handleSubmit() {
    close();
  }

  return (
    <ModalContent className="max-w-md rounded-xl" style={borderStyle}>
      <LeadModalHeader title={SCHEDULE_MEETING.TITLE} subtitle={SCHEDULE_MEETING.SUBTITLE} dividerColor="#E9EAEB" />
      <div className="px-6 py-4 space-y-4">
        <FormField id="meeting-title" label={SCHEDULE_MEETING.TITLE_LABEL} required>
          <Input
            id="meeting-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={SCHEDULE_MEETING.TITLE_PLACEHOLDER}
            className={inputClass}
            style={borderStyle}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="meeting-date" label={SCHEDULE_MEETING.DATE_LABEL} required>
            <DatePickerField id="meeting-date" value={date} onChange={setDate} placeholder={SCHEDULE_MEETING.DATE_PLACEHOLDER} style={borderStyle} />
          </FormField>
          <FormField id="meeting-time" label={SCHEDULE_MEETING.TIME_LABEL}>
            <TimePickerField id="meeting-time" value={time} onChange={setTime} placeholder={SCHEDULE_MEETING.TIME_PLACEHOLDER} style={borderStyle} />
          </FormField>
        </div>

        <FormField id="meeting-type" label={SCHEDULE_MEETING.TYPE_LABEL}>
          <Select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className={inputClass} style={borderStyle}>
            {MEETING_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </FormField>

        <FormField id="meeting-link" label={SCHEDULE_MEETING.LINK_LABEL}>
          <Input
            id="meeting-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={SCHEDULE_MEETING.LINK_PLACEHOLDER}
            className={inputClass}
            style={borderStyle}
          />
        </FormField>

        <FormField id="meeting-agenda" label={SCHEDULE_MEETING.AGENDA_LABEL}>
          <Textarea
            id="meeting-agenda"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder={SCHEDULE_MEETING.AGENDA_PLACEHOLDER}
            rows={4}
            className="w-full rounded-lg border resize-none"
            style={borderStyle}
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="meeting-google-cal"
              checked={addToCalendar}
              onChange={(e) => setAddToCalendar(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="meeting-google-cal" className="text-sm font-medium cursor-pointer" style={{ color: COLORS.TEXT_TITLE }}>
              {SCHEDULE_MEETING.ADD_TO_GOOGLE_CALENDAR_LABEL}
            </Label>
          </div>
          <p className="text-xs pl-6" style={{ color: COLORS.TEXT_MUTED }}>
            {SCHEDULE_MEETING.ADD_TO_GOOGLE_CALENDAR_HELPER}
          </p>
        </div>
      </div>
      <LeadModalFooter
        cancelLabel={SCHEDULE_MEETING.CANCEL}
        submitLabel={SCHEDULE_MEETING.SUBMIT}
        onCancel={close}
        onSubmit={handleSubmit}
      />
    </ModalContent>
  );
}
