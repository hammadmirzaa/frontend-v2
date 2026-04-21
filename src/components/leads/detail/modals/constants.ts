/** Modal copy and options – single source for lead modals */

export const ADD_ACTIVITY = {
  TITLE: "Add Activity",
  SUBTITLE: "Log a new activity for this lead.",
  TYPE_LABEL: "Activity Type",
  TITLE_LABEL: "Title",
  TITLE_PLACEHOLDER: "Enter activity title",
  DESCRIPTION_LABEL: "Description",
  DESCRIPTION_PLACEHOLDER: "Enter activity details...",
  DATE_LABEL: "Date",
  DATE_PLACEHOLDER: "Select date",
  TIME_LABEL: "Time",
  TIME_PLACEHOLDER: "Select time",
  STATUS_LABEL: "Status",
  CANCEL: "Cancel",
  SUBMIT: "Add Activity",
} as const;

export const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
] as const;

export const ACTIVITY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const SCHEDULE_CALL = {
  TITLE: "Schedule Call",
  SUBTITLE: "Schedule a follow-up call with this lead.",
  SUBJECT_LABEL: "Call Subject",
  SUBJECT_PLACEHOLDER: "e.g. Follow up Call",
  DATE_LABEL: "Date",
  DATE_PLACEHOLDER: "Select date",
  TIME_LABEL: "Time",
  TIME_PLACEHOLDER: "Select time",
  PHONE_LABEL: "Phone Number",
  PHONE_PLACEHOLDER: "+1 (555) 123-4567",
  NOTES_LABEL: "Notes",
  NOTES_PLACEHOLDER: "Add notes about this lead...",
  ADD_TO_GOOGLE_CALENDAR_LABEL: "Add to Google Calendar",
  ADD_TO_GOOGLE_CALENDAR_HELPER: "You'll be asked to connect your Google account if not already connected.",
  CANCEL: "Cancel",
  SUBMIT: "Schedule Call",
} as const;

export const SEND_EMAIL = {
  TITLE: "Send Email",
  SUBTITLE: "Compose and send an email to Sarah Johnson",
  TO_LABEL: "To",
  TO_DEFAULT: "sarah.johnson@techcorp.com",
  SUBJECT_LABEL: "Subject",
  SUBJECT_PLACEHOLDER: "Add subject...",
  MESSAGE_LABEL: "Message",
  MESSAGE_PLACEHOLDER: "Hi John Doe,",
  CANCEL: "Cancel",
  SAVE_AS_DRAFT: "Save as Draft",
  SUBMIT: "Send Mail",
} as const;

export const SCHEDULE_MEETING = {
  TITLE: "Schedule Meeting",
  SUBTITLE: "Schedule a meeting with Sarah Johnson",
  TITLE_LABEL: "Meeting Title",
  TITLE_PLACEHOLDER: "e.g. Demo",
  DATE_LABEL: "Date",
  DATE_PLACEHOLDER: "Select date",
  TIME_LABEL: "Time",
  TIME_PLACEHOLDER: "Select time",
  TYPE_LABEL: "Meeting Type",
  TYPE_PLACEHOLDER: "Video Call",
  LINK_LABEL: "Meeting Link",
  LINK_PLACEHOLDER: "Add meeting link...",
  AGENDA_LABEL: "Agenda",
  AGENDA_PLACEHOLDER: "Add meeting agenda or notes...",
  ADD_TO_GOOGLE_CALENDAR_LABEL: "Add to Google Calendar",
  ADD_TO_GOOGLE_CALENDAR_HELPER: "You'll be asked to connect your Google account if not already connected.",
  CANCEL: "Cancel",
  SUBMIT: "Schedule Meeting",
} as const;

export const MEETING_TYPE_OPTIONS = [
  { value: "video", label: "Video Call" },
  { value: "in-person", label: "In Person" },
  { value: "phone", label: "Phone Call" },
] as const;

export const SCHEDULE_FOLLOW_UP = {
  TITLE: "Schedule Follow-Up",
  SUBTITLE: "Set up a follow-up to keep your leads engaged and moving through the pipeline.",
  LEAD_LABEL: "Lead / Contact",
  LEAD_PLACEHOLDER: "Select a Lead",
  TYPE_LABEL: "Follow-Up Type",
  DATE_TIME_LABEL: "Scheduled Date & Time",
  DATE_PLACEHOLDER: "Select date",
  TIME_PLACEHOLDER: "Select time",
  MESSAGE_LABEL: "Message (Optional)",
  MESSAGE_PLACEHOLDER: "Enter your message here...",
  EMAIL_SUBJECT_LABEL: "Email Subject",
  EMAIL_SUBJECT_PLACEHOLDER: "Add subject...",
  EMAIL_MESSAGE_LABEL: "Email Message",
  EMAIL_MESSAGE_PLACEHOLDER: "Hi John Doe,",
  CANCEL: "Cancel",
  CALL_NOW: "Call Now",
  SEND_NOW: "Send now",
  SUBMIT: "Schedule Follow Up",
} as const;

export const FOLLOW_UP_TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "email-sms", label: "Email + SMS" },
] as const;
