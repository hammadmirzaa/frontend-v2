import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Globe,
  Sparkles,
  Loader2,
  Video,
  FileText,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Link2,
  Image as ImageIcon,
  Smile,
  Paperclip,
  FolderPlus,
} from "lucide-react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { useToast } from "../hooks/useToast";
import config from "../config";
import { Button, SelectDropdown } from "./ui";

const API_URL = config.API_URL;

const formatDateTimeLocal = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseApiUtcDate = (value) => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const stringValue = String(value);
  const hasTimezone = /(?:Z|[+\-]\d{2}:\d{2})$/.test(stringValue);
  const normalized = hasTimezone ? stringValue : `${stringValue}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Backend sends UTC without timezone (naive). Interpret as UTC, then output local for input.
const backendUtcToLocalInput = (backendValue) => {
  const date = parseApiUtcDate(backendValue);
  if (!date) return "";
  return formatDateTimeLocal(date);
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (value) => {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Select date";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const parse24HourTime = (timeValue) => {
  if (!timeValue || !timeValue.includes(":"))
    return { hour: "1", minute: "00", period: "AM" };
  const [hourRaw, minuteRaw] = timeValue.split(":");
  const hour24 = Number(hourRaw);
  const minute = String(minuteRaw || "00").padStart(2, "0");
  if (Number.isNaN(hour24)) return { hour: "1", minute, period: "AM" };
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: String(hour12), minute, period };
};

const to24HourTime = (hour, minute, period) => {
  const parsedHour = Number(hour);
  if (Number.isNaN(parsedHour)) return "";
  let hour24 = parsedHour % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const items = [];
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    items.push({ date, day, inCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    items.push({ date, day, inCurrentMonth: true });
  }
  while (items.length % 7 !== 0 || items.length < 42) {
    const index = items.length - (firstWeekday + daysInMonth) + 1;
    const date = new Date(year, month + 1, index);
    items.push({ date, day: index, inCurrentMonth: false });
  }
  return items;
};

const stripMarkdownCodeFence = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

const parseAiEmailDraft = (generatedEmailSubject, generatedEmailContent) => {
  const safeSubject =
    typeof generatedEmailSubject === "string"
      ? generatedEmailSubject.trim()
      : "";
  const safeContent =
    typeof generatedEmailContent === "string"
      ? generatedEmailContent.trim()
      : "";
  const normalizedSubject = safeSubject.toLowerCase();

  let subject =
    normalizedSubject.startsWith("```") || normalizedSubject === "json"
      ? ""
      : safeSubject;
  let content = safeContent;

  const jsonCandidate = stripMarkdownCodeFence(safeContent);
  if (jsonCandidate.startsWith("{") && jsonCandidate.endsWith("}")) {
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (typeof parsed?.subject === "string" && parsed.subject.trim()) {
        subject = parsed.subject.trim();
      }
      if (typeof parsed?.content === "string" && parsed.content.trim()) {
        content = parsed.content.trim();
      }
    } catch {
      // Keep raw values when backend returns non-JSON content.
    }
  }

  return { subject, content };
};

export default function FollowUpModal({
  followup,
  onClose,
  onSave,
  defaultLeadId = "",
  defaultFollowupType = "email",
  uiVariant = "default",
}) {
  const [formData, setFormData] = useState({
    lead_id: "",
    followup_type: "email",
    email_subject: "",
    email_content: "",
    message_content: "",
    internal_notes: "",
    call_status: "",
    call_notes: "",
    scheduled_at: "",
  });
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityStatus, setActivityStatus] = useState("pending");
  const [activityDate, setActivityDate] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(false);
  const [meetingType, setMeetingType] = useState("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [callPhoneNumber, setCallPhoneNumber] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0 });
  const [timePopoverPos, setTimePopoverPos] = useState({ top: 0, left: 0 });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);
  const emailEditorRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dateButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const datePopoverRef = useRef(null);
  const timePopoverRef = useRef(null);

  const { showToast } = useToast();
  const isEditing = !!followup;

  useEffect(() => {
    fetchLeads();

    if (isEditing) {
      const localScheduled = backendUtcToLocalInput(followup.scheduled_at);
      setFormData({
        lead_id: followup.lead_id,
        followup_type: followup.followup_type,
        email_subject: followup.email_subject || "",
        email_content: followup.email_content || "",
        message_content: followup.message_content || "",
        internal_notes: followup.internal_notes || "",
        call_status: followup.call_status || "",
        call_notes: followup.call_notes || "",
        // Convert backend UTC (naive) to local input value
        scheduled_at: localScheduled,
      });
      setActivityTitle(followup.email_subject || followup.internal_notes || "");
      setActivityDescription(
        followup.email_content ||
          followup.message_content ||
          followup.internal_notes ||
          "",
      );
      setActivityStatus(followup.status === "sent" ? "completed" : "pending");
      setActivityDate(localScheduled ? localScheduled.slice(0, 10) : "");
      setActivityTime(localScheduled ? localScheduled.slice(11, 16) : "");
      setCallPhoneNumber(followup?.lead_phone || "");
      setEmailAttachments([]);
      if (localScheduled) {
        setCalendarMonth(new Date(localScheduled));
      }
    } else {
      // Set default scheduled time to 1 hour from now in user's local time.
      const defaultDateTime = formatDateTimeLocal(
        new Date(Date.now() + 60 * 60 * 1000),
      );
      setFormData((prev) => ({
        ...prev,
        lead_id: defaultLeadId || prev.lead_id,
        followup_type: defaultFollowupType || prev.followup_type,
        scheduled_at: defaultDateTime,
      }));
      setActivityTitle("");
      setActivityDescription("");
      setActivityStatus("pending");
      setActivityDate(defaultDateTime.slice(0, 10));
      setActivityTime(defaultDateTime.slice(11, 16));
      setCallPhoneNumber("");
      setEmailAttachments([]);
      setCalendarMonth(new Date(defaultDateTime));
    }
  }, [followup, defaultLeadId, defaultFollowupType]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        (!datePopoverRef.current ||
          !datePopoverRef.current.contains(event.target))
      ) {
        setDatePickerOpen(false);
      }
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target) &&
        (!timePopoverRef.current ||
          !timePopoverRef.current.contains(event.target))
      ) {
        setTimePickerOpen(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );
  const timeSelection = useMemo(
    () => parse24HourTime(activityTime),
    [activityTime],
  );

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leads/`);
      setLeads(response.data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      showToast("Failed to fetch leads", "error");
    } finally {
      setLoadingLeads(false);
    }
  };

  const generateAIContent = async () => {
    if (!formData.lead_id) {
      showToast("Please select a lead first", "error");
      return;
    }

    setGeneratingAI(true);
    try {
      const requestData = {
        lead_id: formData.lead_id,
        type: formData.followup_type,
      };

      // Include subject if it's filled for email types
      if (
        (formData.followup_type === "email" ||
          formData.followup_type === "both") &&
        formData.email_subject.trim()
      ) {
        requestData.subject = formData.email_subject.trim();
      }

      const response = await axios.post(
        `${API_URL}/api/followups/create-content`,
        requestData,
      );

      // Populate the form with generated content
      const data = response.data;
      if (
        (data.generated_email_subject || data.generated_email_content) &&
        (formData.followup_type === "email" ||
          formData.followup_type === "both")
      ) {
        const parsedEmailDraft = parseAiEmailDraft(
          data.generated_email_subject,
          data.generated_email_content,
        );
        setFormData((prev) => ({
          ...prev,
          email_subject: parsedEmailDraft.subject || prev.email_subject,
          email_content: parsedEmailDraft.content || prev.email_content,
        }));
      }

      if (
        data.generated_message_content &&
        (formData.followup_type === "message" ||
          formData.followup_type === "both" ||
          formData.followup_type === "whatsapp")
      ) {
        setFormData((prev) => ({
          ...prev,
          message_content: data.generated_message_content,
        }));
      }

      showToast("AI content generated successfully", "success");
    } catch (error) {
      console.error("Failed to generate AI content:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      showToast(`Failed to generate AI content: ${errorMessage}`, "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.lead_id) {
        throw new Error("Please select a lead");
      }

      if (!formData.scheduled_at) {
        throw new Error("Please select a scheduled time");
      }

      const normalizedData = { ...formData };
      const titleText = activityTitle.trim();
      const descriptionText = activityDescription.trim();

      if (
        (normalizedData.followup_type === "email" ||
          normalizedData.followup_type === "both") &&
        !normalizedData.email_subject &&
        titleText
      ) {
        normalizedData.email_subject = titleText;
      }
      if (
        (normalizedData.followup_type === "email" ||
          normalizedData.followup_type === "both") &&
        !normalizedData.email_content &&
        descriptionText
      ) {
        normalizedData.email_content = descriptionText;
      }
      if (
        (normalizedData.followup_type === "message" ||
          normalizedData.followup_type === "both" ||
          normalizedData.followup_type === "whatsapp") &&
        !normalizedData.message_content &&
        descriptionText
      ) {
        normalizedData.message_content = descriptionText;
      }
      if (
        normalizedData.followup_type === "call" &&
        !normalizedData.internal_notes &&
        descriptionText
      ) {
        normalizedData.internal_notes = descriptionText;
      }
      if (normalizedData.followup_type === "call" && isEditing) {
        if (activityStatus === "completed")
          normalizedData.call_status = "completed";
        if (activityStatus === "scheduled")
          normalizedData.call_status = "rescheduled";
        if (activityStatus === "pending")
          normalizedData.call_status = normalizedData.call_status || "";
      }

      const mergedDate =
        activityDate || normalizedData.scheduled_at.slice(0, 10);
      const mergedTime =
        activityTime || normalizedData.scheduled_at.slice(11, 16);
      if (mergedDate && mergedTime) {
        normalizedData.scheduled_at = `${mergedDate}T${mergedTime}`;
      }

      // Validate content based on type
      if (
        normalizedData.followup_type === "email" ||
        normalizedData.followup_type === "both"
      ) {
        if (!normalizedData.email_subject || !normalizedData.email_content) {
          throw new Error(
            "Email subject and content are required for email follow-ups",
          );
        }
      }

      if (
        normalizedData.followup_type === "message" ||
        normalizedData.followup_type === "both" ||
        normalizedData.followup_type === "whatsapp"
      ) {
        if (!normalizedData.message_content) {
          throw new Error("Message content is required for message follow-ups");
        }
      }

      // Call follow-ups don't require email or message content

      // Remove call-specific fields for create payloads only.
      const submitData = isEditing
        ? normalizedData
        : (({ call_status, call_notes, ...rest }) => rest)(normalizedData);

      // datetime-local is local time; convert to UTC ISO for backend storage.
      const scheduledDate = new Date(normalizedData.scheduled_at);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduled date/time");
      }

      const finalSubmitData = {
        ...submitData,
        scheduled_at: scheduledDate.toISOString(),
      };

      if (isEditing) {
        await axios.put(
          `${API_URL}/api/followups/${followup.id}`,
          finalSubmitData,
        );
        showToast("Follow-up updated successfully", "success");
      } else {
        await axios.post(`${API_URL}/api/followups/`, finalSubmitData);
        showToast("Follow-up created successfully", "success");
      }

      onSave();
    } catch (error) {
      console.error("Failed to save follow-up:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      console.error("Error details:", error.response?.data);
      showToast(
        `Failed to ${isEditing ? "update" : "create"} follow-up: ${errorMessage}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleActivityTypeChange = (nextType) => {
    const mappedType =
      nextType === "meeting"
        ? "both"
        : nextType === "note"
          ? "message"
          : nextType;
    handleInputChange("followup_type", mappedType);
  };

  const selectedActivityType =
    formData.followup_type === "both"
      ? "meeting"
      : formData.followup_type === "message" ||
          formData.followup_type === "whatsapp"
        ? "note"
        : formData.followup_type;

  const syncScheduledDateTime = (nextDate, nextTime) => {
    if (!nextDate || !nextTime) return;
    handleInputChange("scheduled_at", `${nextDate}T${nextTime}`);
  };

  const handleDateSelect = (date) => {
    const nextDate = formatDateForInput(date);
    setActivityDate(nextDate);
    setCalendarMonth(new Date(date));
    syncScheduledDateTime(nextDate, activityTime);
    setDatePickerOpen(false);
  };

  const handleTimePartChange = (part, value) => {
    const nextHour = part === "hour" ? value : timeSelection.hour;
    const nextMinute = part === "minute" ? value : timeSelection.minute;
    const nextPeriod = part === "period" ? value : timeSelection.period;
    const nextTime = to24HourTime(nextHour, nextMinute, nextPeriod);
    setActivityTime(nextTime);
    syncScheduledDateTime(activityDate, nextTime);
  };

  const updateDatePopoverPosition = () => {
    if (!dateButtonRef.current) return;
    const rect = dateButtonRef.current.getBoundingClientRect();
    setDatePopoverPos({
      top: rect.bottom + 8,
      left: rect.left,
    });
  };

  const updateTimePopoverPosition = () => {
    if (!timeButtonRef.current) return;
    const rect = timeButtonRef.current.getBoundingClientRect();
    setTimePopoverPos({
      top: rect.bottom + 8,
      left: rect.left,
    });
  };

  const updateEmailEditorState = () => {
    if (!emailEditorRef.current) return;
    handleInputChange("email_content", emailEditorRef.current.innerHTML);
  };

  const execEmailCommand = (command, value = null) => {
    if (!emailEditorRef.current) return;
    emailEditorRef.current.focus();
    document.execCommand(command, false, value);
    updateEmailEditorState();
  };

  const applyEmailFormat = (type) => {
    if (type === "bold") {
      execEmailCommand("bold");
      return;
    }
    if (type === "italic") {
      execEmailCommand("italic");
      return;
    }
    if (type === "underline") {
      execEmailCommand("underline");
      return;
    }
    if (type === "link") {
      const url = window.prompt("Enter link URL", "https://");
      if (!url) return;
      execEmailCommand("createLink", url);
      return;
    }
    if (type === "image") {
      imageInputRef.current?.click();
    }
  };

  const humanFileSize = (size) => {
    if (!size && size !== 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const addAttachments = (files, source) => {
    const mapped = Array.from(files || []).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}-${file.size}`,
      file,
      name: file.webkitRelativePath || file.name,
      size: file.size,
      source,
    }));
    if (!mapped.length) return;
    setEmailAttachments((prev) => [...prev, ...mapped]);
  };

  const removeAttachment = (id) => {
    setEmailAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAttachmentPick = (event, source) => {
    addAttachments(event.target.files, source);
    // allow re-selecting the same file
    event.target.value = "";
  };

  const insertEmoji = (emojiData) => {
    if (!emailEditorRef.current) return;
    emailEditorRef.current.focus();
    document.execCommand("insertText", false, emojiData.emoji);
    updateEmailEditorState();
  };

  const selectedLead = leads.find((lead) => lead.id === formData.lead_id);
  useEffect(() => {
    if (selectedLead?.phone) setCallPhoneNumber(selectedLead.phone);
  }, [selectedLead?.phone]);

  const isCallLayout = formData.followup_type === "call";
  const isEmailLayout = formData.followup_type === "email";
  const isMeetingLayout = formData.followup_type === "both";
  const isFollowupsUi = uiVariant === "followups";
  /** Rich HTML email editor: Follow-ups shows for `email` or `both` (not only `email`). */
  const showRichEmailEditor = useMemo(
    () =>
      isFollowupsUi
        ? formData.followup_type === "email" ||
          formData.followup_type === "both"
        : formData.followup_type === "email",
    [isFollowupsUi, formData.followup_type],
  );
  useEffect(() => {
    if (!showRichEmailEditor || !emailEditorRef.current) return;
    if (emailEditorRef.current.innerHTML !== (formData.email_content || "")) {
      emailEditorRef.current.innerHTML = formData.email_content || "";
    }
  }, [formData.email_content, showRichEmailEditor]);

  useEffect(() => {
    if (!datePickerOpen && !timePickerOpen) return undefined;
    const handleReposition = () => {
      if (datePickerOpen) updateDatePopoverPosition();
      if (timePickerOpen) updateTimePopoverPosition();
    };
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [datePickerOpen, timePickerOpen]);

  const modalTitle = isFollowupsUi
    ? isEditing
      ? "Reschedule Follow-Up"
      : "Schedule Follow-Up"
    : isCallLayout
      ? "Schedule Call"
      : isEmailLayout
        ? "Send Email"
        : isMeetingLayout
          ? "Schedule Meeting"
          : "Add Activity";
  const modalSubtitle = selectedLead?.name
    ? isFollowupsUi
      ? "Set up a follow-up to keep your leads engaged and moving through the pipeline."
      : isCallLayout
        ? `Schedule a phone call with ${selectedLead.name}`
        : isEmailLayout
          ? `Compose and send an email to ${selectedLead.name}`
          : isMeetingLayout
            ? `Schedule a meeting with ${selectedLead.name}`
            : ""
    : isFollowupsUi
      ? "Set up a follow-up to keep your leads engaged and moving through the pipeline."
      : "";
  const submitLabel = loading
    ? "Saving..."
    : isCallLayout
      ? "Schedule Call"
      : isEmailLayout
        ? "Send Mail"
        : isMeetingLayout
          ? "Schedule Meeting"
          : isEditing
            ? "Update Activity"
            : "Add Activity";

  return (
    <>
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="followup-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200"
        aria-label="Close dialog"
        onClick={onClose}
      />
        <div
          className={`relative z-10 flex max-h-[min(92vh,560px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-slide-in max-w-[600px] mx-auto } `}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-6">
            <div>
              <h2
                id="followup-modal-title"
                className={`text-base leading-tight font-semibold text-gray-900`}
              >
                {modalTitle}
            </h2>
              {modalSubtitle ? (
                <p className="mt-1 text-xs text-gray-500">{modalSubtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              <X size={24} />
            </button>
        </div>

          <div className="min-h-0 flex flex-1 flex-col bg-white">
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-5">
                  {!selectedLead || isFollowupsUi ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isFollowupsUi ? "Lead / Contact" : "Select Lead *"}
            </label>
            {loadingLeads ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-500">
                            Loading leads...
                          </span>
              </div>
            ) : (
                        <SelectDropdown
                value={formData.lead_id}
                          onChange={(value) =>
                            handleInputChange("lead_id", value)
                          }
                          options={[
                            {
                              value: "",
                              label: isFollowupsUi
                                ? "Select a Lead"
                                : "Choose a lead...",
                            },
                            ...leads.map((lead) => ({
                              value: lead.id,
                              label: isFollowupsUi
                                ? `${lead.name}${lead.company ? ` (${lead.company})` : ""}`
                                : `${lead.name} - ${lead.email} (${lead.status})`,
                            })),
                          ]}
                        />
                      )}
                    </div>
                  ) : null}

                  {isFollowupsUi ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Follow-Up Type
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { value: "call", label: "Call", icon: Phone },
                            { value: "email", label: "Email", icon: Mail },
                            {
                              value: "message",
                              label: "SMS",
                              iconSrc: "/svgs/followups/email.svg",
                            },
                            {
                              value: "both",
                              label: "Email + SMS",
                              iconSrc: "/svgs/followups/emailnsms.svg",
                            },
                          ].map((typeOption) => {
                            const active =
                              formData.followup_type === typeOption.value;
                            const LucideIcon = typeOption.icon;
                            return (
                              <button
                                key={typeOption.value}
                                type="button"
                                onClick={() =>
                                  handleInputChange(
                                    "followup_type",
                                    typeOption.value,
                                  )
                                }
                                className={`rounded-lg border px-2 py-5 text-left transition ${active ? "border-brand-teal bg-brand-teal/10" : "border-gray-200 bg-white hover:border-gray-300"}`}
                              >
                                {typeOption.iconSrc ? (
                                  <img
                                    src={typeOption.iconSrc}
                                    alt=""
                                    className="mb-1 h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <LucideIcon
                                    size={18}
                                    className="mb-1 text-gray-700"
                                  />
                                )}
                                <p className="text-sm mt-2 font-semibold text-gray-900">
                                  {typeOption.label}
                                </p>
                              </button>
                            );
                          })}
                </div>
              </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="relative" ref={datePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Scheduled Date & Time
                          </label>
                          <button
                            ref={dateButtonRef}
                            type="button"
                            onClick={() => {
                              updateDatePopoverPosition();
                              setDatePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Calendar size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityDate ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityDate
                                ? formatDateDisplay(activityDate)
                                : "Select date"}
                            </span>
                          </button>
                        </div>
                        <div className="relative" ref={timePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-transparent select-none">
                            Time
                          </label>
                          <button
                            ref={timeButtonRef}
                            type="button"
                            onClick={() => {
                              updateTimePopoverPosition();
                              setTimePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Clock3 size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityTime ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityTime
                                ? `${timeSelection.hour}:${timeSelection.minute} ${timeSelection.period}`
                                : "Select time"}
                            </span>
                          </button>
                        </div>
          </div>

                      {formData.followup_type === "email" ||
                      formData.followup_type === "both" ? (
                        <>
          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Email Subject
            </label>
                <input
                              type="text"
                              value={formData.email_subject}
                              onChange={(e) =>
                                handleInputChange(
                                  "email_subject",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                              placeholder="Add subject..."
                            />
                  </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">
                                Message
              </label>
                              <button
                                type="button"
                                onClick={generateAIContent}
                                disabled={generatingAI || !formData.lead_id}
                                className="inline-flex items-center gap-1 rounded-md border border-[#1C808B] px-2 py-1 text-xs font-medium text-[#1C808B] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {generatingAI ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                {generatingAI
                                  ? "Generating..."
                                  : "Generate AI Content"}
                              </button>
                            </div>
                            <div className="rounded-lg border border-gray-200">
                              <div
                                ref={emailEditorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={updateEmailEditorState}
                                onBlur={updateEmailEditorState}
                                className="min-h-[190px] w-full rounded-t-lg border-0 px-3 py-3 text-sm text-gray-900 outline-none"
                                data-placeholder="Hi John Doe,"
                                style={{ whiteSpace: "pre-wrap" }}
                              />
                              <div
                                className="relative border-t border-gray-200 px-3 py-2"
                                ref={emojiPickerRef}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyEmailFormat("bold")}
                                    className="rounded px-2 py-1 text-base font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    title="Bold"
                                  >
                                    B
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyEmailFormat("italic")}
                                    className="rounded px-2 py-1 text-base italic text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    title="Italic"
                                  >
                                    I
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      applyEmailFormat("underline")
                                    }
                                    className="rounded px-2 py-1 text-base underline text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    title="Underline"
                                  >
                                    U
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyEmailFormat("link")}
                                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    title="Insert link"
                                  >
                                    <Link2 size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    title="Attach file"
                                  >
                                    <Paperclip size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      folderInputRef.current?.click()
                                    }
                                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    title="Attach folder"
                                  >
                                    <FolderPlus size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyEmailFormat("image")}
                                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    title="Attach image"
                                  >
                                    <ImageIcon size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      setEmojiPickerOpen((prev) => !prev)
                                    }
                                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    title="Insert emoji"
                                  >
                                    <Smile size={18} />
                                  </button>
                  </div>
                                {emojiPickerOpen ? (
                                  <div className="absolute bottom-11 left-0 z-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                                    <EmojiPicker
                                      onEmojiClick={insertEmoji}
                                      lazyLoadEmojis
                                      width={320}
                                      height={360}
                                    />
                </div>
                                ) : null}
                              </div>
                            </div>
                            {emailAttachments.length ? (
                              <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                                {emailAttachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center justify-between rounded-md bg-white px-2.5 py-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-medium text-gray-800">
                                        {attachment.name}
                                      </p>
                                      <p className="text-[11px] text-gray-500">
                                        {humanFileSize(attachment.size)} •{" "}
                                        {attachment.source}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeAttachment(attachment.id)
                                      }
                                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                      title="Remove attachment"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}

                      {formData.followup_type === "message" ||
                      formData.followup_type === "both" ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            {formData.followup_type === "both"
                              ? "SMS Message Content"
                              : "SMS Message Content"}
              </label>
                          <textarea
                            value={formData.message_content}
                            onChange={(e) =>
                              handleInputChange(
                                "message_content",
                                e.target.value,
                              )
                            }
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                            placeholder="Enter your message here..."
                          />
                        </div>
                      ) : null}

                      {formData.followup_type === "call" ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Message (Optional)
                          </label>
                          <textarea
                            value={formData.internal_notes}
                            onChange={(e) =>
                              handleInputChange(
                                "internal_notes",
                                e.target.value,
                              )
                            }
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                            placeholder="Enter your message here..."
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {!isFollowupsUi && (isCallLayout || isMeetingLayout) ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {isCallLayout ? "Call Subject" : "Meeting Title"}
                        </label>
                <input
                          type="text"
                          value={activityTitle}
                          onChange={(e) => setActivityTitle(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                          placeholder={
                            isCallLayout ? "e.g Follow up Call" : "e.g Demo"
                          }
                        />
                  </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="relative" ref={datePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Date
                          </label>
                          <button
                            ref={dateButtonRef}
                            type="button"
                            onClick={() => {
                              updateDatePopoverPosition();
                              setDatePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Calendar size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityDate ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityDate
                                ? formatDateDisplay(activityDate)
                                : "Select date"}
                            </span>
                          </button>
                </div>

                        <div className="relative" ref={timePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Time
              </label>
                          <button
                            ref={timeButtonRef}
                            type="button"
                            onClick={() => {
                              updateTimePopoverPosition();
                              setTimePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Clock3 size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityTime ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityTime
                                ? `${timeSelection.hour}:${timeSelection.minute} ${timeSelection.period}`
                                : "Select time"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {isCallLayout ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                <input
                            type="text"
                            value={callPhoneNumber}
                            onChange={(e) => setCallPhoneNumber(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                            placeholder="+1 (555) 123-4567"
                          />
                    </div>
                      ) : (
                        <>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Meeting Type
                            </label>
                            <SelectDropdown
                              value={meetingType}
                              onChange={setMeetingType}
                              options={[
                                { value: "video", label: "Video Call" },
                                { value: "phone", label: "Phone Call" },
                                { value: "in_person", label: "In Person" },
                              ]}
                            />
                  </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Meeting Link
              </label>
                <input
                              type="text"
                              value={meetingLink}
                              onChange={(e) => setMeetingLink(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                              placeholder="Add meeting link..."
                            />
                  </div>
                        </>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {isCallLayout ? "Notes" : "Agenda"}
                        </label>
                        <textarea
                          value={activityDescription}
                          onChange={(e) =>
                            setActivityDescription(e.target.value)
                          }
                          rows={4}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                          placeholder={
                            isCallLayout
                              ? "Add notes about this lead..."
                              : "Add meeting agenda or notes..."
                          }
                        />
                </div>

                      {/* <label className="flex items-start gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={addToGoogleCalendar}
                          onChange={(e) =>
                            setAddToGoogleCalendar(e.target.checked)
                          }
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                        />
                        <span>
                          <span className="font-medium">
                            Add to Google Calendar
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            You'll be asked to connect your Google account if
                            not already connected.
                          </span>
                        </span>
                      </label> */}
                    </>
                  ) : null}

                  {!isFollowupsUi && isEmailLayout ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          To
              </label>
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800">
                          <Mail size={13} className="text-gray-500" />
                          <span>
                            {selectedLead?.email || "Select lead to load email"}
                          </span>
            </div>
          </div>

              <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Subject
                </label>
                <input
                  type="text"
                  value={formData.email_subject}
                          onChange={(e) =>
                            handleInputChange("email_subject", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                          placeholder="Add subject..."
                          required
                />
              </div>

              <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Message
                  </label>
                  <button
                    type="button"
                    onClick={generateAIContent}
                    disabled={generatingAI || !formData.lead_id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#1C808B] px-2 py-1 text-xs font-medium text-[#1C808B] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingAI ? (
                              <Loader2 size={12} className="animate-spin" />
                    ) : (
                              <Sparkles size={12} />
                    )}
                            {generatingAI ? "Generating..." : "Generate AI Content"}
                  </button>
                </div>
                        <div className="rounded-lg border border-gray-200">
                          <div
                            ref={emailEditorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={updateEmailEditorState}
                            onBlur={updateEmailEditorState}
                            className="min-h-[190px] w-full rounded-t-lg border-0 px-3 py-3 text-sm text-gray-900 outline-none"
                            data-placeholder="Hi John Doe,"
                            style={{ whiteSpace: "pre-wrap" }}
                          />
                          <div
                            className="relative border-t border-gray-200 px-3 py-2"
                            ref={emojiPickerRef}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyEmailFormat("bold")}
                                className="rounded px-2 py-1 text-base font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                title="Bold"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyEmailFormat("italic")}
                                className="rounded px-2 py-1 text-base italic text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                title="Italic"
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyEmailFormat("underline")}
                                className="rounded px-2 py-1 text-base underline text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                title="Underline"
                              >
                                U
                              </button>
                              {/* <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyEmailFormat("link")}
                                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                title="Insert link"
                              >
                                <Link2 size={18} />
                              </button> */}
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                title="Attach file"
                              >
                                <Paperclip size={18} />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => folderInputRef.current?.click()}
                                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                title="Attach folder"
                              >
                                <FolderPlus size={18} />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyEmailFormat("image")}
                                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                title="Attach image"
                              >
                                <ImageIcon size={18} />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  setEmojiPickerOpen((prev) => !prev)
                                }
                                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                title="Insert emoji"
                              >
                                <Smile size={18} />
                              </button>
              </div>
                            {emojiPickerOpen ? (
                              <div className="absolute bottom-11 left-0 z-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                                <EmojiPicker
                                  onEmojiClick={insertEmoji}
                                  lazyLoadEmojis
                                  width={320}
                                  height={360}
                                />
            </div>
                            ) : null}
                          </div>
                        </div>
                        {emailAttachments.length ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                            {emailAttachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between rounded-md bg-white px-2.5 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-gray-800">
                                    {attachment.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {humanFileSize(attachment.size)} •{" "}
                                    {attachment.source}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAttachment(attachment.id)
                                  }
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                  title="Remove attachment"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {!isFollowupsUi &&
                  !isCallLayout &&
                  !isEmailLayout &&
                  !isMeetingLayout ? (
                    <>
            <div>
                        <label className="mb-2 block text-sm font-normal text-gray-900">
                          Activity Type
                </label>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {[
                            { value: "call", label: "Call", icon: Phone },
                            { value: "email", label: "Email", icon: Mail },
                            { value: "meeting", label: "Meeting", icon: Video },
                            { value: "note", label: "Note", icon: FileText },
                          ].map((typeOption) => {
                            const Icon = typeOption.icon;
                            const isActive =
                              selectedActivityType === typeOption.value;
                            return (
                <button
                                key={typeOption.value}
                  type="button"
                                onClick={() =>
                                  handleActivityTypeChange(typeOption.value)
                                }
                                className={`rounded-xl border px-4 py-6 text-left transition ${
                                  isActive
                                    ? "border-brand-teal bg-brand-teal/10"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <Icon
                                  className="mb-1 text-gray-700 w-4 h-4"
                                />
                                <p className="text-sm mt-2 font-semibold text-gray-900">
                                  {typeOption.label}
                                </p>
                </button>
                            );
                          })}
              </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          value={activityTitle}
                          onChange={(e) => setActivityTitle(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                          placeholder="Enter activity title"
                        />
              </div>
            <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Description
              </label>
              <textarea
                          value={activityDescription}
                          onChange={(e) =>
                            setActivityDescription(e.target.value)
                          }
                          rows={4}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-teal"
                          placeholder="Enter activity details..."
                        />
            </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="relative" ref={datePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Date
                </label>
                          <button
                            ref={dateButtonRef}
                            type="button"
                            onClick={() => {
                              updateDatePopoverPosition();
                              setDatePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Calendar size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityDate ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityDate
                                ? formatDateDisplay(activityDate)
                                : "Select date"}
                            </span>
                          </button>
              </div>

                        <div className="relative" ref={timePickerRef}>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Time
                </label>
                          <button
                            ref={timeButtonRef}
                            type="button"
                            onClick={() => {
                              updateTimePopoverPosition();
                              setTimePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left"
                          >
                            <Clock3 size={15} className="text-brand-teal" />
                            <span
                              className={`text-sm ${activityTime ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {activityTime
                                ? `${timeSelection.hour}:${timeSelection.minute} ${timeSelection.period}`
                                : "Select time"}
                            </span>
                          </button>
              </div>
            </div>

          <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Status
            </label>
                        <SelectDropdown
                          value={activityStatus}
                          onChange={(value) => setActivityStatus(value)}
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "scheduled", label: "Scheduled" },
                            { value: "completed", label: "Completed" },
                          ]}
              />
            </div>
                    </>
                  ) : null}

                  {/* {!isFollowupsUi && (isCallLayout || isMeetingLayout) ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center space-x-1">
              <Globe size={12} className="text-gray-400" />
              <p className="text-xs text-gray-500">
                          Timezone: Your local time (
                          {Intl.DateTimeFormat().resolvedOptions().timeZone})
              </p>
            </div>
                      {formData.scheduled_at ? (
                        <p className="mt-1 text-xs text-gray-600">
                          Scheduled preview:{" "}
                          {new Date(formData.scheduled_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  ) : null} */}
                </div>
              </div>

              {/* Hidden file inputs: shared by Leads + Follow-ups rich email editors */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => handleAttachmentPick(event, "file")}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                directory=""
                webkitdirectory=""
                className="hidden"
                onChange={(event) => handleAttachmentPick(event, "folder")}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleAttachmentPick(event, "image");
                  const [firstImage] = Array.from(event.target.files || []);
                  if (!firstImage) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const imageHtml = `<img src="${reader.result}" alt="${firstImage.name}" />`;
                    execEmailCommand("insertHTML", imageHtml);
                  };
                  reader.readAsDataURL(firstImage);
                }}
              />

              {/* Actions */}
              {!isFollowupsUi && isEmailLayout ? (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-5 py-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="px-4 py-2.5 text-xs font-semibold"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              ) : isFollowupsUi ? (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-5 py-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCallLayout ? "Call Now" : "Send now"}
                      </Button>
                    ) : null}
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? "Saving..."
                        : isEditing
                          ? "Update Follow Up"
                          : "Schedule Follow Up"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-gray-200 bg-white px-5 py-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitLabel}
                  </Button>
              </div>
            )}
            </form>
          </div>
        </div>
      </div>

      {(isFollowupsUi || !isEmailLayout) && datePickerOpen
        ? createPortal(
            <div
              ref={datePopoverRef}
              className="fixed z-[140] w-[270px] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
              style={{
                top: `${datePopoverPos.top}px`,
                left: `${datePopoverPos.left}px`,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft size={15} />
                </button>
                <p className="text-xs font-semibold text-gray-800">
                  {calendarMonth.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  type="button"
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight size={15} />
                </button>
          </div>
              <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-gray-500">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day} className="py-1">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((entry) => {
                  const dateKey = formatDateForInput(entry.date);
                  const isSelected = dateKey === activityDate;
                  return (
            <button
                      key={`${dateKey}-${entry.day}`}
              type="button"
                      onClick={() => handleDateSelect(entry.date)}
                      className={`mx-auto h-7 w-7 rounded-full text-[11px] ${
                        isSelected
                          ? "bg-brand-teal text-white"
                          : entry.inCurrentMonth
                            ? "text-gray-800 hover:bg-gray-100"
                            : "text-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {entry.day}
            </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}

      {(isFollowupsUi || !isEmailLayout) && timePickerOpen
        ? createPortal(
            <div
              ref={timePopoverRef}
              className="fixed z-[140] w-[270px] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
              style={{
                top: `${timePopoverPos.top}px`,
                left: `${timePopoverPos.left}px`,
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="mb-1 text-[11px] text-gray-500">Hour</p>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-1">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
                      (hour) => (
            <button
                          key={hour}
                          type="button"
                          onClick={() => handleTimePartChange("hour", hour)}
                          className={`w-full rounded px-1.5 py-1 text-xs ${timeSelection.hour === hour ? "bg-brand-teal/15 text-brand-teal" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          {hour}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-gray-500">Minute</p>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-1">
                    {[
                      "00",
                      "05",
                      "10",
                      "15",
                      "20",
                      "25",
                      "30",
                      "35",
                      "40",
                      "45",
                      "50",
                      "55",
                    ].map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleTimePartChange("minute", minute)}
                        className={`w-full rounded px-1.5 py-1 text-xs ${timeSelection.minute === minute ? "bg-brand-teal/15 text-brand-teal" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        {minute}
            </button>
                    ))}
          </div>
        </div>
                <div>
                  <p className="mb-1 text-[11px] text-gray-500">Period</p>
                  <div className="space-y-1 rounded-md border border-gray-200 p-1">
                    {["AM", "PM"].map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => handleTimePartChange("period", period)}
                        className={`w-full rounded px-1.5 py-1.5 text-xs ${timeSelection.period === period ? "bg-brand-teal/15 text-brand-teal" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        {period}
                      </button>
                    ))}
      </div>
    </div>
              </div>
            </div>,
            document.body,
  )
        : null}
    </>
  );
}
