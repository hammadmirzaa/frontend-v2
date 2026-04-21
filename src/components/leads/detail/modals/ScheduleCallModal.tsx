"use client";

import { useState } from "react";
import { ModalContent, useModalContext, FormField, Input, Textarea, Checkbox, Label } from "@/components/ui";
import { LeadModalHeader, LeadModalFooter } from "./LeadModalShell";
import { DatePickerField } from "./DatePickerField";
import { TimePickerField } from "./TimePickerField";
import { SCHEDULE_CALL } from "./constants";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const BODY_CLASS = "px-6 py-4 space-y-4";
const INPUT_CLASS = "h-11 rounded-lg border w-full";

export function ScheduleCallModalContent() {
  const { close } = useModalContext();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(false);

  const handleSubmit = () => {
    close();
  };

  const inputBorderStyle = { borderColor: COLORS.CARD_BORDER };

  return (
    <ModalContent
      className={cn("rounded-xl")}
      style={{ borderColor: COLORS.CARD_BORDER }}
    >
      <LeadModalHeader title={SCHEDULE_CALL.TITLE} subtitle={SCHEDULE_CALL.SUBTITLE} dividerColor="#E9EAEB" />
      <div className={BODY_CLASS}>
        <FormField id="call-subject" label={SCHEDULE_CALL.SUBJECT_LABEL} required>
          <Input
            id="call-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={SCHEDULE_CALL.SUBJECT_PLACEHOLDER}
            className={INPUT_CLASS}
            style={inputBorderStyle}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="call-date" label={SCHEDULE_CALL.DATE_LABEL} required>
            <DatePickerField id="call-date" value={date} onChange={setDate} placeholder={SCHEDULE_CALL.DATE_PLACEHOLDER} style={inputBorderStyle} />
          </FormField>
          <FormField id="call-time" label={SCHEDULE_CALL.TIME_LABEL}>
            <TimePickerField id="call-time" value={time} onChange={setTime} placeholder={SCHEDULE_CALL.TIME_PLACEHOLDER} style={inputBorderStyle} />
          </FormField>
        </div>

        <FormField id="call-phone" label={SCHEDULE_CALL.PHONE_LABEL}>
          <Input
            id="call-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={SCHEDULE_CALL.PHONE_PLACEHOLDER}
            className={INPUT_CLASS}
            style={inputBorderStyle}
          />
        </FormField>

        <FormField id="call-notes" label={SCHEDULE_CALL.NOTES_LABEL}>
          <Textarea
            id="call-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={SCHEDULE_CALL.NOTES_PLACEHOLDER}
            rows={5}
            className="w-full min-h-[106px] rounded-lg border resize-none"
            style={inputBorderStyle}
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="call-add-to-google-calendar"
              checked={addToGoogleCalendar}
              onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="call-add-to-google-calendar" className="text-sm font-medium cursor-pointer" style={{ color: COLORS.TEXT_TITLE }}>
              {SCHEDULE_CALL.ADD_TO_GOOGLE_CALENDAR_LABEL}
            </Label>
          </div>
          <p className="text-xs pl-6" style={{ color: COLORS.TEXT_MUTED }}>
            {SCHEDULE_CALL.ADD_TO_GOOGLE_CALENDAR_HELPER}
          </p>
        </div>
      </div>
      <LeadModalFooter
        cancelLabel={SCHEDULE_CALL.CANCEL}
        submitLabel={SCHEDULE_CALL.SUBMIT}
        onCancel={close}
        onSubmit={handleSubmit}
      />
    </ModalContent>
  );
}
