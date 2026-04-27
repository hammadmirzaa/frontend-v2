import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  Clock3,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Phone,
  SlidersHorizontal,
  Target,
  User,
  UserPlus,
  Video,
  Tag,
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useToast } from "../hooks/useToast";
import config from "../config";
import FollowUpModal from "./FollowUpModal";
import Modal from "./Modal";
import { Button, Pagination, SearchInput, SelectDropdown, Table } from "./ui";
import TextField from "./form/TextField";
import { COLORS } from "../lib/designTokens";
import { formatDateDMY } from "../utils/formatDateDMY";
import { cycleTableSort } from "../utils/tableSort";

const API_URL = config.API_URL;

/** Icons in public/svgs/leads/ — filenames differ from API enums */
function leadsFollowupIconSrc(kind) {
  const file =
    kind === "call" || kind === "calls"
      ? "call"
      : kind === "email" || kind === "emails"
        ? "email"
        : kind === "both" || kind === "meetings"
          ? "product-demo"
          : "activity";
  return `/svgs/leads/${file}.svg`;
}

export default function LeadsTab() {
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLeadDetail, setLoadingLeadDetail] = useState(false);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [expandedTimelineItems, setExpandedTimelineItems] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [followupDefaultType, setFollowupDefaultType] = useState("call");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [scheduledTab, setScheduledTab] = useState("today");
  const [currentPage, setCurrentPage] = useState(1);
  const [leadSort, setLeadSort] = useState({ column: null, dir: null });
  const [leadInfoEditing, setLeadInfoEditing] = useState(false);
  const [leadEditDraft, setLeadEditDraft] = useState(null);
  const [savingLeadInfo, setSavingLeadInfo] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchLeads();
    fetchFollowups();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, priorityFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/leads/`);
      setLeads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast(
        "Failed to fetch leads: " +
          (error.response?.data?.detail || error.message),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowups = async () => {
    setLoadingFollowups(true);
    try {
      const response = await axios.get(`${API_URL}/api/followups/`);
      setFollowups(response.data?.followups || []);
    } catch {
      setFollowups([]);
    } finally {
      setLoadingFollowups(false);
    }
  };

  const normalizeLeadStatus = (status) => {
    if (status === "converted") return "won";
    return status || "new";
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-emerald-100 text-emerald-700",
      contacted: "bg-blue-100 text-blue-700",
      qualified: "bg-yellow-100 text-yellow-700",
      won: "bg-green-100 text-green-700",
      lost: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const resolvePriority = (lead) => {
    const score = Number(lead?.qualification_score || 0);
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  const handleLeadClick = async (leadId) => {
    setSelectedLeadId(leadId);
    setLeadInfoEditing(false);
    setLeadEditDraft(null);
    setNoteEditorOpen(false);
    setNoteDraft("");
    setDetailTab("overview");
    setLoadingLeadDetail(true);
    try {
      const response = await axios.get(`${API_URL}/api/leads/${leadId}`);
      setSelectedLead(response.data);
    } catch (error) {
      showToast(
        "Failed to load lead details: " +
          (error.response?.data?.detail || error.message),
        "error",
      );
    } finally {
      setLoadingLeadDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedLeadId(null);
    setSelectedLead(null);
    setDetailTab("overview");
    setLeadInfoEditing(false);
    setLeadEditDraft(null);
    setNoteEditorOpen(false);
    setNoteDraft("");
  };

  const openLeadInfoEdit = () => {
    if (!selectedLead) return;
    setLeadEditDraft({
      name: selectedLead.name || "",
      email: selectedLead.email || "",
      phone: selectedLead.phone || "",
      company: selectedLead.company || "",
      source: selectedLead.source || "",
      status: selectedLead.status || "new",
      priority: resolvePriority(selectedLead),
    });
    setLeadInfoEditing(true);
  };

  const cancelLeadInfoEdit = () => {
    setLeadInfoEditing(false);
    setLeadEditDraft(null);
  };

  const priorityToScore = (p) => (p === "high" ? 85 : p === "medium" ? 55 : 25);

  const saveLeadInfo = async () => {
    if (!selectedLeadId || !leadEditDraft) return;
    const name = leadEditDraft.name.trim();
    const email = leadEditDraft.email.trim();
    if (!name || !email) {
      showToast("Name and email are required", "error");
      return;
    }
    setSavingLeadInfo(true);
    try {
      const { data } = await axios.put(
        `${API_URL}/api/leads/${selectedLeadId}`,
        {
          name,
          email,
          phone: leadEditDraft.phone.trim() || undefined,
          company: leadEditDraft.company.trim() || undefined,
          source: leadEditDraft.source.trim() || undefined,
          status: leadEditDraft.status,
          qualification_score: priorityToScore(leadEditDraft.priority),
        },
      );
      setSelectedLead(data);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === data.id
            ? {
                ...l,
                name: data.name,
                email: data.email,
                company: data.company,
                phone: data.phone,
                qualification_score: data.qualification_score,
                source: data.source,
                status: data.status,
              }
            : l,
        ),
      );
      showToast("Lead updated successfully", "success");
      setLeadInfoEditing(false);
      setLeadEditDraft(null);
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          error.message ||
          "Failed to update lead",
        "error",
      );
    } finally {
      setSavingLeadInfo(false);
    }
  };

  const saveLeadNote = async () => {
    if (!selectedLeadId) return;
    const nextNote = noteDraft.trim();
    if (!nextNote) {
      showToast("Please write a note first", "error");
      return;
    }
    const existing = (selectedLead?.notes || "").trim();
    const merged = existing ? `${existing}\n\n${nextNote}` : nextNote;
    setSavingNote(true);
    try {
      const { data } = await axios.put(
        `${API_URL}/api/leads/${selectedLeadId}`,
        {
          notes: merged,
        },
      );
      setSelectedLead(data);
      setLeads((prev) =>
        prev.map((l) => (l.id === data.id ? { ...l, notes: data.notes } : l)),
      );
      setNoteEditorOpen(false);
      setNoteDraft("");
      showToast("Note added successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.detail || error.message || "Failed to add note",
        "error",
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleLeadUpdate = () => {
    fetchLeads();
    fetchFollowups();
    if (selectedLeadId) {
      handleLeadClick(selectedLeadId);
    }
  };

  const openFollowupForLead = (type) => {
    if (!selectedLeadId) return;
    setFollowupDefaultType(type);
    setFollowupModalOpen(true);
  };

  const closeFollowUpModal = () => {
    setFollowupModalOpen(false);
  };

  const toggleTimelineItemExpansion = (itemId) => {
    setExpandedTimelineItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const qualified = leads.filter(
      (lead) => lead.status === "qualified" || lead.status === "converted",
    ).length;
    const converted = leads.filter(
      (lead) => lead.status === "converted",
    ).length;
    const conversionRate =
      totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;
    const activities = leads.filter(
      (lead) => lead.contacted_at || lead.converted_at || lead.notes,
    ).length;
    return { totalLeads, qualified, conversionRate, activities };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchPool =
        `${lead.name || ""} ${lead.email || ""} ${lead.company || ""}`.toLowerCase();
      const matchesQuery = searchPool.includes(query.trim().toLowerCase());
      const normalizedStatus = normalizeLeadStatus(lead.status);
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || resolvePriority(lead) === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [leads, query, statusFilter, priorityFilter]);

  const sortedFilteredLeads = useMemo(() => {
    const list = [...filteredLeads];
    const { column, dir } = leadSort;
    if (!column || !dir) return list;
    const mult = dir === "asc" ? 1 : -1;
    const activityTs = (row) =>
      new Date(
        row.contacted_at || row.converted_at || row.created_at || 0,
      ).getTime();
    const priorityRank = (row) => {
      const p = resolvePriority(row);
      if (p === "high") return 3;
      if (p === "medium") return 2;
      return 1;
    };
    list.sort((a, b) => {
      switch (column) {
        case "name":
          return (
            mult *
            String(a.name || "").localeCompare(
              String(b.name || ""),
              undefined,
              {
                sensitivity: "base",
              },
            )
          );
        case "email":
          return (
            mult *
            String(a.email || "").localeCompare(
              String(b.email || ""),
              undefined,
              {
                sensitivity: "base",
              },
            )
          );
        case "status":
          return (
            mult *
            String(normalizeLeadStatus(a.status)).localeCompare(
              String(normalizeLeadStatus(b.status)),
              undefined,
              { sensitivity: "base" },
            )
          );
        case "priority":
          return mult * (priorityRank(a) - priorityRank(b));
        case "last_activity":
          return mult * (activityTs(a) - activityTs(b));
        default:
          return 0;
      }
    });
    return list;
  }, [filteredLeads, leadSort]);

  const pageSize = 20;
  const totalPages = Math.max(
    1,
    Math.ceil(sortedFilteredLeads.length / pageSize),
  );
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedLeads = sortedFilteredLeads.slice(
    pageStart,
    pageStart + pageSize,
  );

  const onLeadSort = useCallback((columnId) => {
    setLeadSort((prev) => cycleTableSort(columnId, prev));
  }, []);

  const leadColumns = [
    {
      id: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    { id: "email", label: "Email", accessor: "email", sortable: true },
    { id: "company", label: "Company", render: (row) => row.company || "—" },
    {
      id: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const status = normalizeLeadStatus(row.status);
        return (
          <span
            className={`inline-flex min-w-[86px] justify-center rounded-lg px-4 py-1.5 text-xs font-semibold ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      id: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => {
        const priority = resolvePriority(row);
        const styleMap = {
          high: "bg-red-100 text-red-700",
          medium: "bg-yellow-100 text-yellow-700",
          low: "bg-gray-100 text-gray-600",
        };
        return (
          <span
            className={`inline-flex min-w-[82px] justify-center rounded-lg px-4 py-1.5 text-xs font-semibold ${styleMap[priority]}`}
          >
            {priority[0].toUpperCase() + priority.slice(1)}
          </span>
        );
      },
    },
    {
      id: "last_activity",
      label: "Last Activity",
      sortable: true,
      render: (row) =>
        formatDateDMY(row.contacted_at || row.converted_at || row.created_at),
    },
  ];

  const summaryCards = [
    { label: "Total leads", value: stats.totalLeads },
    { label: "Qualified", value: stats.qualified },
    { label: "Conversion Rate", value: `${stats.conversionRate}%` },
    { label: "Activities", value: stats.activities },
  ];

  const followupCards = useMemo(() => {
    const now = new Date();
    const leadsMap = new Map(leads.map((lead) => [lead.id, lead]));
    return followups
      .filter((item) => item.status === "scheduled")
      .map((item) => {
        const scheduledAt = new Date(item.scheduled_at);
        const isSameDay =
          scheduledAt.getDate() === now.getDate() &&
          scheduledAt.getMonth() === now.getMonth() &&
          scheduledAt.getFullYear() === now.getFullYear();
        const state =
          scheduledAt < now ? "overdue" : isSameDay ? "today" : "upcoming";
        return {
          ...item,
          state,
          scheduledAt,
          lead: leadsMap.get(item.lead_id) || null,
        };
      })
      .filter((item) =>
        scheduledTab === "upcoming"
          ? item.state !== "overdue"
          : item.state === scheduledTab,
      )
      .slice(0, 4);
  }, [followups, leads, scheduledTab]);

  const detailStatus = selectedLead
    ? normalizeLeadStatus(selectedLead.status)
    : "new";
  const detailPriority = selectedLead ? resolvePriority(selectedLead) : "low";
  const detailPriorityStyle = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-600",
  };
  const leadNotes = selectedLead?.notes
    ? selectedLead.notes.split("\n\n").filter(Boolean)
    : [];
  const leadActivities = followups
    .filter((item) => item.lead_id === selectedLeadId)
    .slice(0, 3);
  const formatMessageTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const timelineItems = useMemo(() => {
    if (!selectedLead) return [];

    const mappedFollowups = followups
      .filter((item) => item.lead_id === selectedLead.id)
      .map((item) => {
        const kindMap = {
          call: "calls",
          email: "emails",
          both: "meetings",
          message: "notes",
          whatsapp: "notes",
        };
        const stateMap = {
          sent: "completed",
          completed: "completed",
          scheduled: "scheduled",
        };
        return {
          id: item.id,
          type: kindMap[item.followup_type] || "notes",
          title:
            item.followup_type === "call"
              ? "Follow-up Call Scheduled"
              : item.followup_type === "email"
                ? "Sent Proposal Email"
                : item.followup_type === "both"
                  ? "Demo Meeting"
                  : "Follow-up Activity",
          when: item.scheduled_at,
          owner: "John Doe",
          description:
            item.internal_notes ||
            item.message_content ||
            item.email_subject ||
            "Activity created for this lead.",
          state: stateMap[item.status] || "scheduled",
          source: "followup",
        };
      });

    const seedItems = [];
    if (selectedLead.first_query) {
      seedItems.push({
        id: `initial-${selectedLead.id}`,
        type: "notes",
        title: "Initial Contact",
        when: selectedLead.created_at,
        owner: "System",
        description: selectedLead.first_query,
        state: "completed",
        source: "seed",
      });
    }

    if (selectedLead.notes) {
      seedItems.push({
        id: `notes-${selectedLead.id}`,
        type: "notes",
        title: "Lead Notes Added",
        when: selectedLead.contacted_at || selectedLead.created_at,
        owner: "John Doe",
        description: selectedLead.notes,
        state: "completed",
        source: "seed",
      });
    }

    return [...mappedFollowups, ...seedItems]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .filter((item) =>
        timelineFilter === "all" ? true : item.type === timelineFilter,
      );
  }, [followups, selectedLead, timelineFilter]);

  return (
    <>
      <ToastContainer />

      {followupModalOpen ? (
        <FollowUpModal
          followup={null}
          defaultLeadId={selectedLeadId || ""}
          defaultFollowupType={followupDefaultType}
          onClose={closeFollowUpModal}
          onSave={() => {
            closeFollowUpModal();
            handleLeadUpdate();
          }}
        />
      ) : null}

      <div className="h-full rounded-lg bg-[#FAFBFC] p-6">
        {selectedLeadId ? (
          <div className="space-y-5">
            <div className="text-sm text-gray-500">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="font-medium hover:text-brand-teal"
              >
                Leads
              </button>{" "}
              /{" "}
              <span className="font-semibold text-gray-700">Leads Details</span>
            </div>

            {loadingLeadDetail || !selectedLead ? (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
                Loading lead details...
              </div>
                ) : (
                  <>
                <div className="">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="gap-2 flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-cyan-100 p-3 text-brand-teal">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">
                            {selectedLead.name}
                          </h2>
                        </div>
                      </div>
                      <div className="gap-2 flex flex-col">
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-md px-4 py-1.5 text-xs font-semibold ${getStatusColor(detailStatus)}`}
                          >
                            {detailStatus.charAt(0).toUpperCase() +
                              detailStatus.slice(1)}
                          </span>
                          <span
                            className={`inline-flex rounded-md px-4 py-1.5 text-xs font-semibold ${detailPriorityStyle[detailPriority]}`}
                          >
                            {detailPriority[0].toUpperCase() +
                              detailPriority.slice(1)}{" "}
                            Priority
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Tag className="h-4 w-4 " />
                            Lead Score: {selectedLead.qualification_score}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1 text-gray-900">
                            <Mail className="h-4 w-4 " /> {selectedLead.email}
                          </span>
                          <span className="flex items-center gap-1 text-gray-900">
                            <Phone className="h-4 w-4 " />{" "}
                            {selectedLead.phone || "N/A"}
                          </span>
                          <span className="flex items-center gap-1 text-gray-900">
                            <img src="/svgs/leads/org.svg" alt="Building" className="h-4 w-4" />
                            {selectedLead.company || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* <Button type="button" variant="outline" onClick={handleCloseDetail}>
                      <ArrowLeft className="h-4 w-4" />
                      Back to Leads
                    </Button> */}
                  </div>

                  <div className="mt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-8 ">
                      {[
                        { id: "overview", label: "Overview" },
                        { id: "timeline", label: "Timeline" },
                        { id: "chatbot", label: "Chatbot Interaction" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailTab(tab.id)}
                          className="border-b-[2px] px-5 py-3 text-xs font-semibold transition-colors"
                          style={{
                            color:
                              detailTab === tab.id
                                ? COLORS.BRAND
                                : '#6b7280',
                            borderBottomColor:
                              detailTab === tab.id
                                ? COLORS.BRAND
                                : "transparent",
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                  </div>
                  </div>
                </div>

                {detailTab === "overview" ? (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                      <div className="flex max-h-[min(520px,70vh)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 xl:max-h-none">
                        <div className="mb-4 flex shrink-0 items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">
                            Lead Information
                          </h3>
                          {!leadInfoEditing ? (
                  <button
                              type="button"
                              onClick={openLeadInfoEdit}
                              className="rounded-lg p-1.5 text-brand-teal transition-colors hover:bg-gray-50"
                              aria-label="Edit lead information"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                          ) : null}
                        </div>
                        {leadInfoEditing && leadEditDraft ? (
                          <>
                            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
                    <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900">
                                  Full Name
                                </label>
                                <TextField
                                  value={leadEditDraft.name}
                                  onChange={(e) =>
                                    setLeadEditDraft((d) => ({
                                      ...d,
                                      name: e.target.value,
                                    }))
                                  }
                                  autoComplete="name"
                                />
                    </div>
                              <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900">
                                  Email
                                </label>
                                <TextField
                                  type="email"
                                  value={leadEditDraft.email}
                                  onChange={(e) =>
                                    setLeadEditDraft((d) => ({
                                      ...d,
                                      email: e.target.value,
                                    }))
                                  }
                                  autoComplete="email"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900">
                                  Phone
                                </label>
                                <TextField
                                  type="tel"
                                  value={leadEditDraft.phone}
                                  onChange={(e) =>
                                    setLeadEditDraft((d) => ({
                                      ...d,
                                      phone: e.target.value,
                                    }))
                                  }
                                  autoComplete="tel"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900">
                                  Company
                                </label>
                                <TextField
                                  value={leadEditDraft.company}
                                  onChange={(e) =>
                                    setLeadEditDraft((d) => ({
                                      ...d,
                                      company: e.target.value,
                                    }))
                                  }
                                  autoComplete="organization"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-gray-900">
                                  Lead Source
                                </label>
                                <TextField
                                  value={leadEditDraft.source}
                                  onChange={(e) =>
                                    setLeadEditDraft((d) => ({
                                      ...d,
                                      source: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. embedded_chatbot"
                                />
                              </div>
                              <SelectDropdown
                                variant="field"
                                label="Lead Status"
                                value={leadEditDraft.status}
                                onChange={(v) =>
                                  setLeadEditDraft((d) => ({ ...d, status: v }))
                                }
                                options={[
                                  { value: "new", label: "New" },
                                  { value: "contacted", label: "Contacted" },
                                  { value: "qualified", label: "Qualified" },
                                  { value: "converted", label: "Won" },
                                ]}
                              />
                              <SelectDropdown
                                variant="field"
                                label="Lead Priority"
                                value={leadEditDraft.priority}
                                onChange={(v) =>
                                  setLeadEditDraft((d) => ({
                                    ...d,
                                    priority: v,
                                  }))
                                }
                                options={[
                                  { value: "low", label: "Low" },
                                  { value: "medium", label: "Medium" },
                                  { value: "high", label: "High" },
                                ]}
                              />
                            </div>
                            <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-100 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelLeadInfoEdit}
                                disabled={savingLeadInfo}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={saveLeadInfo}
                                disabled={savingLeadInfo}
                              >
                                {savingLeadInfo ? "Saving…" : "Save"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Full Name
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedLead.name}
                              </p>
                    </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Email
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedLead.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Phone
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedLead.phone || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Company
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedLead.company || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Lead Source
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedLead.source || "Website Chatbot"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Lead Status
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {detailStatus.charAt(0).toUpperCase() +
                                  detailStatus.slice(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Lead Priority
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {detailPriority.charAt(0).toUpperCase() +
                                  detailPriority.slice(1)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">
                            Notes
                          </h3>
                          <button
                            type="button"
                            onClick={() => setNoteEditorOpen((v) => !v)}
                            className="rounded-full border border-brand-teal p-1 text-brand-teal transition-colors hover:bg-brand-teal/5"
                            aria-label="Add note"
                          >
                            <Plus className="h-4 w-4" />
                  </button>
                        </div>
                        {noteEditorOpen ? (
                          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <TextField
                              multiline
                              rows={3}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Write a note..."
                            />
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setNoteEditorOpen(false);
                                  setNoteDraft("");
                                }}
                                disabled={savingNote}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={saveLeadNote}
                                disabled={savingNote}
                              >
                                {savingNote ? "Saving…" : "Add Note"}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        {leadNotes.length ? (
                          leadNotes.map((note, idx) => (
                            <div
                              key={idx}
                              className="mb-3 rounded-lg bg-gray-50 p-4 last:mb-0"
                            >
                              <p className="text-sm font-semibold leading-relaxed text-gray-900">
                                {note}
                              </p>
                              <p className="mt-3 text-xs text-gray-400">
                                John Doe • Yesterday at 12:16 PM
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-700">
                              No notes added yet.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                          Recent Activity
                        </h3>
                        {leadActivities.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No recent activity found.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {leadActivities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3"
                              >
                                <img
                                  src={leadsFollowupIconSrc(
                                    activity.followup_type,
                                  )}
                                  alt=""
                                  className="h-10 w-10"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {activity.followup_type === "call"
                                      ? "Follow-up Call Scheduled"
                                      : activity.followup_type === "email"
                                        ? "Sent Proposal Email"
                                        : activity.followup_type === "both"
                                          ? "Demo Meeting"
                                          : "Follow-up Activity"}
                                  </p>
                                  <p className="line-clamp-1 text-sm text-gray-500">
                                    {activity.internal_notes ||
                                      activity.message_content ||
                                      activity.email_subject ||
                                      "Activity logged"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDateDMY(activity.scheduled_at)}
                                  </p>
                  </div>
                              </div>
                            ))}
                  <button
                              type="button"
                              onClick={() => setDetailTab("timeline")}
                              className="w-full rounded-lg bg-cyan-50 py-2 text-sm font-semibold text-brand-teal"
                            >
                              View All Activities
                            </button>
                    </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                          Quick Actions
                        </h3>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => openFollowupForLead("call")}
                            className="flex w-full items-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white"
                          >
                            <Phone className="h-4 w-4" />
                            Schedule Call
                  </button>
                  <button
                            type="button"
                            onClick={() => openFollowupForLead("email")}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          >
                            <Mail className="h-4 w-4" />
                            Send Email
                  </button>
                  <button
                            type="button"
                            onClick={() => openFollowupForLead("both")}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          >
                            <Video className="h-4 w-4" />
                            Schedule Meeting
                          </button>
                          <button
                            type="button"
                            onClick={() => openFollowupForLead("message")}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          >
                            <Plus className="h-4 w-4" />
                            Add Activity
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                          Lead Owner
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-cyan-100 p-2 text-brand-teal">
                            <User className="h-5 w-5" />
                          </div>
                    <div>
                            <p className="text-sm font-semibold text-gray-900">
                              John Doe
                            </p>
                            <p className="text-xs text-gray-500">
                              Sales Manager
                            </p>
                    </div>
                </div>
            </div>
          </div>
        </div>
                ) : null}

                {detailTab === "timeline" ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        Activity Timeline
                      </h3>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => openFollowupForLead("message")}
                      >
                        <Plus className="h-4 w-4" />
                        Add Activity
                      </Button>
                    </div>

                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "All Activities" },
                        { id: "calls", label: "Calls" },
                        { id: "emails", label: "Emails" },
                        { id: "meetings", label: "Meetings" },
                        { id: "notes", label: "Notes" },
                      ].map((item) => (
                <button
                          key={item.id}
                          type="button"
                          onClick={() => setTimelineFilter(item.id)}
                          className="rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                          style={{
                            borderColor:
                              timelineFilter === item.id
                                ? COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG
                                : COLORS.GRAY_200,
                            color:
                              timelineFilter === item.id
                                ? COLORS.BRAND
                                : COLORS.GRAY_600,
                            backgroundColor:
                              timelineFilter === item.id
                                ? COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG
                                : "#fff",
                          }}
                        >
                          {item.label}
                </button>
              ))}
            </div>

                    {timelineItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
                        No activities found for this filter.
          </div>
                    ) : (
                      <div className="relative space-y-4 pl-8">
                        <div className="absolute bottom-2 left-4 top-2 w-px bg-gray-200" />
                        {timelineItems.map((item) => (
                          <div key={item.id} className="relative px-2">
                            <div className="absolute -left-8 top-0 flex items-center justify-center rounded-full">
                              <img
                                src={leadsFollowupIconSrc(item.type)}
                                alt=""
                                className="h-8 w-8"
                              />
        </div>
                            <div className="rounded-xl bg-gray-50 p-4 ">
                              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDateDMY(item.when)} • by {item.owner}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-md px-4 py-1.5 text-xs font-semibold ${
                                    item.state === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {item.state === "completed"
                                    ? "Completed"
                                    : "Scheduled"}
                                </span>
                              </div>
                              <p className={`${expandedTimelineItems.includes(item.id) ? '' : 'line-clamp-2'} border-b border-gray-200 pb-2 text-xs text-gray-900`}>
                                {item.description}
                              </p>
                              <button
                                type="button"
                                className="mt-3 text-xs font-semibold text-brand-teal"
                                onClick={() => toggleTimelineItemExpansion(item.id)}
                              >
                                {expandedTimelineItems.includes(item.id) ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {detailTab === "chatbot" ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white h-full max-h-[min(520px,70vh)]">
                    <div className="border-b border-gray-100 px-5 py-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Chat Conversation
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Started on {formatDateDMY(selectedLead.created_at)}
                      </p>
                    </div>
                    {!selectedLead.messages ||
                    selectedLead.messages.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-500">
                        No conversation history available.
            </div>
          ) : (
                      <div className="max-h-[416px] space-y-5 overflow-y-auto bg-white p-5">
                        {selectedLead.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`flex max-w-[92%] items-start gap-3 ${message.role === "assistant" ? "flex-row-reverse" : ""}`}
                            >
                              <img
                                src={`/svgs/leads/${message.role === "assistant" ? "user2" : "user"}.svg`}
                                alt={
                                  message.role === "assistant"
                                    ? "Assistant"
                                    : "User"
                                }
                                className="h-10 w-10"
                              />
                              <div
                                className={
                                  message.role === "assistant"
                                    ? "text-right"
                                    : "text-left"
                                }
                              >
                                <p className="mb-2 text-sm font-semibold text-gray-900">
                                  {message.role === "assistant"
                                    ? "Assistant"
                                    : selectedLead.name}
                                  <span className="ml-2 text-xs font-normal text-gray-500">
                                    {formatMessageTime(message.timestamp)}
                        </span>
                                </p>
                                <div
                                  className={`rounded-lg px-4 py-3 text-sm text-gray-800 ${message.role === "assistant" ? `bg-[${COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG}]` : "bg-gray-50"}`}
                                >
                                  {message.role === "assistant" ? (
                                    <div className="prose prose-sm max-w-none text-left">
                                      <ReactMarkdown>
                                        {message.content}
                                      </ReactMarkdown>
                      </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-left">
                                      {message.content}
                                    </p>
                                  )}
                        </div>
                              </div>
                            </div>
                          </div>
                        ))}
                          </div>
                        )}
                          </div>
                ) : null}
              </>
                        )}
                        </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                    </div>
              ))}
                      </div>

            {leads.length > 0 ? (
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Scheduled Activities
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "today", label: "Today" },
                      { id: "upcoming", label: "Upcoming" },
                      { id: "overdue", label: "Overdue" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScheduledTab(item.id)}
                        className="rounded-lg border px-2 py-1 text-xs font-normal transition-colors"
                        style={{
                          borderColor:
                            scheduledTab === item.id
                              ? COLORS.BRAND
                              : '#e5e7eb',
                          color:
                            scheduledTab === item.id
                              ? COLORS.BRAND
                              : '#6b7280', 
                          backgroundColor:
                            scheduledTab === item.id
                              ? COLORS.BRAND_ACTIVE_BG
                              : "#fff",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                    <img src="/svgs/leads/calendar.svg" alt="Calendar" className="h-5 w-5" />
                    </div>
                  </div>

                {loadingFollowups ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Loading activities...
                  </div>
                ) : followupCards.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No activities for this filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {followupCards.map((item) => {
                      const timeLabel = item.scheduledAt.toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        },
                      );
                      const dateLabel =
                        item.state === "today"
                          ? "Today"
                          : item.state === "overdue"
                            ? "Overdue"
                            : formatDateDMY(item.scheduledAt);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex gap-3">
                            <img
                              src={leadsFollowupIconSrc(item.followup_type)}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-contain"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.followup_type === "call"
                                      ? "Follow-up Call"
                                      : item.followup_type === "email"
                                        ? "Send Proposal"
                                        : item.followup_type === "both"
                                          ? "Demo Meeting"
                                          : "Scheduled Follow-up"}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {item.lead?.name || "Unknown Lead"}
                                    {item.lead?.company ? ` • ${item.lead.company}` : ""}
                                  </p>
                                </div>
                                <span
                                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.state === "overdue" ? "bg-red-500" : "bg-green-500"}`}
                                  aria-hidden
                                />
                              </div>
                              <div className="mt-4 flex items-center justify-between pt-3 text-sm">
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                                  {timeLabel}
                                </span>
                                <span
                                  className={
                                    item.state === "overdue"
                                      ? "text-sm font-semibold text-red-600"
                                      : "text-sm font-semibold text-green-600"
                                  }
                                >
                                  {dateLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
              </div>
            ) : null}

            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 md:p-6 ">
              {loading ? (
                <div className="py-16 text-center text-gray-500">
                  Loading leads...
                    </div>
              ) : leads.length === 0 ? (
                <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
                  <div className="mb-5 rounded-xl bg-cyan-50 p-3 text-brand-teal">
                    <UserPlus className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    No Leads Yet
                  </h3>
                  <p className="mt-3 max-w-xl text-sm text-gray-500">
                    Start building your sales pipeline by adding your first
                    lead. Track prospects, manage activities, and close more
                    deals.
                  </p>
                  <div className="my-8 h-px w-full max-w-2xl bg-gray-200" />

                  <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 rounded-xl bg-blue-100 p-3 text-blue-600">
                        <Target className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        Track Progress
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Monitor lead status from initial contact to closed deal
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="mb-3 rounded-xl bg-violet-100 p-3 text-violet-600">
                        <CalendarCheck2 className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        Schedule Activities
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Never miss a follow-up with automated reminders
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="mb-3 rounded-xl bg-green-100 p-3 text-green-600">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        Analyze Data
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Get insights with conversion rates and performance
                        metrics
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex flex-col gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        All Leads
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        All leads captured from your chatbots and connected
                        sources.
                      </p>
                    </div>
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                      <div className="w-full">
                        <SearchInput
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search leads by name, company, email..."
                          className="w-full lg:max-w-[460px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <SelectDropdown
                          value={statusFilter}
                          onChange={setStatusFilter}
                          options={[
                            { value: "all", label: "All Status" },
                            { value: "new", label: "New" },
                            { value: "contacted", label: "Contacted" },
                            { value: "qualified", label: "Qualified" },
                            { value: "won", label: "Won" },
                            { value: "lost", label: "Lost" },
                          ]}
                          className="w-full lg:w-[160px] lg:space-y-0"
                        />
                        <SelectDropdown
                          value={priorityFilter}
                          onChange={setPriorityFilter}
                          options={[
                            { value: "all", label: "All Priority" },
                            { value: "high", label: "High" },
                            { value: "medium", label: "Medium" },
                            { value: "low", label: "Low" },
                          ]}
                          className="w-full lg:w-[160px] lg:space-y-0"
                        />
                        {/* <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          onClick={() => setFilterOpen(true)}
                        >
                          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                          Filters
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button> */}
                      </div>
                    </div>
                  </div>
                  {sortedFilteredLeads.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                      No leads match your search or filters.
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-col overflow-hidden">
                      <Table
                        columns={leadColumns}
                        data={paginatedLeads}
                        keyExtractor={(row) => row.id}
                        minWidth="980px"
                        onSortClick={onLeadSort}
                        sortColumnId={leadSort.column}
                        sortDirection={leadSort.dir}
                        onRowClick={(row) => handleLeadClick(row.id)}
                      />
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="shrink-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
          )}
        </div>

      <Modal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Options"
        panelClassName="max-w-lg"
      >
        <div className="space-y-5">
          <SelectDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "qualified", label: "Qualified" },
              { value: "won", label: "Won" },
              { value: "lost", label: "Lost" },
            ]}
          />

          <SelectDropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: "All Priority" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear Filters
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setFilterOpen(false)}
              style={{ backgroundColor: COLORS.BRAND }}
            >
              Apply Filters
            </Button>
      </div>
        </div>
      </Modal>
    </>
  );
}
