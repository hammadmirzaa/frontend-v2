"use client";

import { useState } from "react";
import {
  ModalContent,
  useModalContext,
  FormField,
  Input,
  ListDropdown,
  Textarea,
} from "@/components/ui";
import { LeadModalHeader, LeadModalFooter } from "./LeadModalShell";
import { DatePickerField } from "./DatePickerField";
import { TimePickerField } from "./TimePickerField";
import { ADD_ACTIVITY, ACTIVITY_TYPES, ACTIVITY_STATUS_OPTIONS } from "./constants";
import { COLORS, shadows } from "@/lib/design-tokens";
import { PhoneIcon, EnvelopeIcon, VideoIcon, DocumentIcon } from "../components/icons";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS = { call: PhoneIcon, email: EnvelopeIcon, meeting: VideoIcon, note: DocumentIcon } as const;
const borderStyle = { borderColor: COLORS.CARD_BORDER };

export function AddActivityModalContent() {
  const { close } = useModalContext();
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState("pending");

  function handleSubmit() {
    close();
  }

  return (
    <ModalContent className="max-w-md rounded-xl" style={borderStyle}>
      <LeadModalHeader title={ADD_ACTIVITY.TITLE} dividerColor="#E9EAEB" />
      <div className="px-6 py-4 space-y-4">
        <FormField id="activity-type" label={ADD_ACTIVITY.TYPE_LABEL} required>
          <div className="grid grid-cols-4 gap-2 ">
            {ACTIVITY_TYPES.map((o) => {
              const Icon = ACTIVITY_ICONS[o.value];
              const selected = type === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={cn(
                    "flex flex-col justify-left text-left gap-1.5 rounded-lg border px-2 py-5 text-sm transition-colors cursor-pointer font-semibold",
                  )}
                  style={{
                    borderColor: selected ? COLORS.BRAND_BORDER : COLORS.CARD_BORDER,
                    color: COLORS.TEXT_TITLE, backgroundColor: selected ? COLORS.INPUT_BRAND_SELECTED : COLORS.WHITE,
                    ...(selected ? { boxShadow: shadows.sm } : {}),
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: COLORS.TEXT_BODY }} />
                  {o.label}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField id="activity-title" label={ADD_ACTIVITY.TITLE_LABEL} required>
          <Input
            id="activity-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={ADD_ACTIVITY.TITLE_PLACEHOLDER}
            className="h-11 rounded-lg border w-full"
            style={borderStyle}
          />
        </FormField>

        <FormField id="activity-description" label={ADD_ACTIVITY.DESCRIPTION_LABEL}>
          <Textarea
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={ADD_ACTIVITY.DESCRIPTION_PLACEHOLDER}
            rows={3}
            className="w-full rounded-lg border resize-none"
            style={borderStyle}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="activity-date" label={ADD_ACTIVITY.DATE_LABEL} required>
            <DatePickerField value={date} onChange={setDate} placeholder={ADD_ACTIVITY.DATE_PLACEHOLDER} style={borderStyle} />
          </FormField>
          <FormField id="activity-time" label={ADD_ACTIVITY.TIME_LABEL}>
            <TimePickerField value={time} onChange={setTime} placeholder={ADD_ACTIVITY.TIME_PLACEHOLDER} style={borderStyle} />
          </FormField>
        </div>

        <FormField id="activity-status" label={ADD_ACTIVITY.STATUS_LABEL}>
          <ListDropdown
            id="activity-status"
            options={ACTIVITY_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={status}
            onChange={setStatus}
            placeholder="Select status"
            className="h-11 w-full rounded-lg border"
          />
        </FormField>
      </div>
      <LeadModalFooter cancelLabel={ADD_ACTIVITY.CANCEL} submitLabel={ADD_ACTIVITY.SUBMIT} onCancel={close} onSubmit={handleSubmit} />
    </ModalContent>
  );
}
