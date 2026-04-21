import { COLORS } from "@/lib/design-tokens";

export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "chatbot", label: "Chatbot Interaction" },
] as const;

export const MOCK_NOTE = {
  body: "High-value enterprise lead. Decision maker with budget authority. Interested in full CRM implementation for 50+ users.",
  author: "John Doe",
  time: "Yesterday at 12:16 PM",
};

export const MOCK_ACTIVITIES = [
  { icon: "phone" as const, iconBg: COLORS.ACTIVITY_ICON_BG_BLUE, title: "Follow-up Call Scheduled", desc: "Discussed product features and pricing options. Client showed strong interest in...", time: "2025-01-14 at 10:30 AM" },
  { icon: "envelope" as const, iconBg: COLORS.ACTIVITY_ICON_BG_PURPLE, title: "Sent Proposal Email", desc: "Sent detailed proposal with custom pricing for enterprise package.....", time: "2025-01-13 at 2:15 PM" },
  { icon: "video" as const, iconBg: COLORS.ACTIVITY_ICON_BG_GREEN, title: "Demo Meeting", desc: "Product demo scheduled with decision makers....", time: "2025-01-16 at 3:00 PM" },
];

export const TIMELINE_FILTERS = [
  { id: "all", label: "All Activities" },
  { id: "calls", label: "Calls" },
  { id: "emails", label: "Emails" },
  { id: "meetings", label: "Meetings" },
  { id: "notes", label: "Notes" },
] as const;

export type TimelineActivityType = "call" | "email" | "meeting" | "note";
export type TimelineActivityStatus = "completed" | "scheduled";

export const TIMELINE_FILTER_TO_TYPE: Record<string, TimelineActivityType> = {
  calls: "call",
  emails: "email",
  meetings: "meeting",
  notes: "note",
};

export const MOCK_TIMELINE_ACTIVITIES = [
  { type: "call" as TimelineActivityType, icon: "phone", iconBg: COLORS.ACTIVITY_ICON_BG_PURPLE, iconColor: COLORS.BRAND, title: "Follow-up Call Scheduled", desc: "Discussed product features and pricing options. Client showed strong interest in enterprise plan.", time: "2025-01-14 at 10:30 AM", by: "John Doe", status: "completed" as TimelineActivityStatus },
  { type: "email" as TimelineActivityType, icon: "envelope", iconBg: COLORS.ACTIVITY_ICON_BG_PURPLE, iconColor: COLORS.BRAND, title: "Sent Proposal Email", desc: "Sent detailed proposal with custom pricing for enterprise package.", time: "2025-01-13 at 2:15 PM", by: "John Doe", status: "completed" as TimelineActivityStatus },
  { type: "meeting" as TimelineActivityType, icon: "video", iconBg: COLORS.ACTIVITY_ICON_BG_GREEN, iconColor: COLORS.GREEN, title: "Demo Meeting", desc: "Product demo scheduled with decision makers.", time: "2025-01-16 at 3:00 PM", by: "John Doe", status: "scheduled" as TimelineActivityStatus },
  { type: "note" as TimelineActivityType, icon: "document", iconBg: COLORS.ACTIVITY_ICON_BG_BLUE, iconColor: COLORS.SKY, title: "Initial Contact", desc: "First touchpoint via website chatbot. Lead requested demo.", time: "2025-01-10 at 11:00 AM", by: "System", status: "completed" as TimelineActivityStatus },
];

export const ACTIVITY_STATUS_PILL: Record<TimelineActivityStatus, { bg: string; text: string }> = {
  completed: { bg: "#DCFCE7", text: "#166534" },
  scheduled: { bg: "#DBEAFE", text: "#1d4ed8" },
};

export const CHAT_STARTED_DATE = "2025-01-10";

export const MOCK_CHAT_MESSAGES = [
  { from: "lead" as const, name: "Sarah Johnson", time: "2025-01-10 11:00 AM", body: "Hi, I'm interested in learning more about your CRM solution for our team." },
  { from: "agent" as const, name: "John Doe", time: "2025-01-10 11:05 AM", body: "Hello Sarah! Thank you for reaching out. I'd be happy to help you find the right solution. How large is your team?" },
  { from: "lead" as const, name: "Sarah Johnson", time: "2025-01-10 11:08 AM", body: "We have about 50 people across sales and marketing teams. We need better lead tracking and automation." },
  { from: "agent" as const, name: "John Doe", time: "2025-01-10 11:12 AM", body: "Perfect! Our Enterprise plan would be ideal for your needs. It includes advanced automation, custom workflows, and unlimited users. Would you be available for a demo this week?" },
];

export const LEAD_OWNER = { name: "John Doe", title: "Sales Manager" };
export const PLACEHOLDER_PHONE = "+1 (555) 123-4567";
export const PLACEHOLDER_POSITION = "VP of Marketing";
export const PLACEHOLDER_LOCATION = "San Francisco, CA";
export const PLACEHOLDER_LEAD_SCORE = "85";
