import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Plus,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MoreHorizontal,
  CalendarDays,
  SendHorizontal,
  ClipboardList,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import FollowUpModal from './FollowUpModal'
import { COLORS } from '../lib/designTokens'
import { SelectDropdown } from './ui'

const API_URL = config.API_URL

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses', hint: 'Show every follow-up' },
  { value: 'scheduled', label: 'Scheduled', hint: 'Waiting to send' },
  { value: 'sent', label: 'Sent', hint: 'Delivered' },
  { value: 'failed', label: 'Failed', hint: 'Errors or bounces' },
  { value: 'cancelled', label: 'Cancelled', hint: 'Stopped manually' },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All types', hint: 'Email, SMS, WhatsApp, call' },
  { value: 'email', label: 'Email only', hint: 'Email channel' },
  { value: 'message', label: 'SMS only', hint: 'Text message' },
  { value: 'whatsapp', label: 'WhatsApp', hint: 'WhatsApp message' },
  { value: 'both', label: 'Email + SMS', hint: 'Both channels' },
  { value: 'call', label: 'Call', hint: 'Phone follow-up' },
]

const SORT_OPTIONS = [
  { value: 'due_asc', label: 'Due Date (Asc.)' },
  { value: 'due_desc', label: 'Due Date (Desc.)' },
  { value: 'name_asc', label: 'Lead Name (A-Z)' },
  { value: 'name_desc', label: 'Lead Name (Z-A)' },
]

function CheckmarkRadioRow({ label, hint, selected, onSelect, compact = false }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-col items-stretch justify-between gap-1.5 rounded-xl border-2 px-2.5 py-2 text-left transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${
        compact ? 'min-h-0 sm:min-h-0' : 'min-h-[4rem] sm:min-h-0'
      } ${
        selected
          ? 'border-indigo-500 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-500/15'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className="min-w-0">
        <span className={`block font-semibold text-gray-900 ${compact ? 'text-xs leading-tight' : 'text-sm'}`}>{label}</span>
        {hint ? (
          <span className={`mt-0.5 block leading-snug text-gray-500 ${compact ? 'line-clamp-2 text-[10px]' : 'text-[11px]'}`}>
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={`flex shrink-0 items-center justify-center self-end rounded-lg border-2 transition-colors duration-200 sm:self-auto ${
          compact ? 'h-7 w-7' : 'h-8 w-8'
        } ${
          selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-transparent'
        }`}
        aria-hidden
      >
        <Check className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={3} />
      </span>
    </button>
  )
}

const parseApiUtcDate = (value) => {
  if (!value) return null
  const stringValue = String(value)
  const hasTimezone = /(?:Z|[+\-]\d{2}:\d{2})$/.test(stringValue)
  const normalized = hasTimezone ? stringValue : `${stringValue}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateForInput = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateDisplay = (value) => {
  if (!value) return 'mm/dd/yyyy'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'mm/dd/yyyy'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const items = []
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i
    const date = new Date(year, month - 1, day)
    items.push({ date, day, inCurrentMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    items.push({ date, day, inCurrentMonth: true })
  }
  while (items.length % 7 !== 0 || items.length < 42) {
    const index = items.length - (firstWeekday + daysInMonth) + 1
    const date = new Date(year, month + 1, index)
    items.push({ date, day: index, inCurrentMonth: false })
  }
  return items
}

export default function FollowUpsTab() {
  const [followups, setFollowups] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('due_asc')
  const [chatbotFilter, setChatbotFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [draftTypeFilter, setDraftTypeFilter] = useState('all')
  const [draftSortBy, setDraftSortBy] = useState('due_asc')
  const [draftChatbotFilter, setDraftChatbotFilter] = useState('all')
  const [draftFromDate, setDraftFromDate] = useState('')
  const [draftToDate, setDraftToDate] = useState('')
  const filterDropdownRef = useRef(null)
  const filterTriggerRef = useRef(null)
  const filterPanelRef = useRef(null)
  const datePopoverRef = useRef(null)
  const fromDateButtonRef = useRef(null)
  const toDateButtonRef = useRef(null)
  const [filterPanelPosition, setFilterPanelPosition] = useState({ top: 0, left: 0, width: 352, placement: 'bottom' })
  const [activeDateField, setActiveDateField] = useState(null)
  const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0 })
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedFollowUp, setSelectedFollowUp] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [schedulerStatus, setSchedulerStatus] = useState(null)
  const [runningScheduler, setRunningScheduler] = useState(false)
  const [query, setQuery] = useState('')
  const [lane, setLane] = useState('due_now')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null)
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchFollowUps()
    fetchStats()
    // fetchSchedulerStatus() // Disabled - using FastAPI scheduler
  }, [statusFilter, typeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, lane, statusFilter, typeFilter, sortBy, chatbotFilter, fromDate, toDate])

  useEffect(() => {
    const onPointerDown = (event) => {
      const clickedFilterTrigger = filterDropdownRef.current?.contains(event.target)
      const clickedFilterPanel = filterPanelRef.current?.contains(event.target)
      const clickedDatePopover = datePopoverRef.current?.contains(event.target)
      if (!clickedFilterTrigger && !clickedFilterPanel && !clickedDatePopover) {
        setFilterModalOpen(false)
        setActiveDateField(null)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFilterModalOpen(false)
        setActiveDateField(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const updateFilterPanelPosition = () => {
    if (!filterTriggerRef.current) return
    const rect = filterTriggerRef.current.getBoundingClientRect()
    const width = Math.min(352, window.innerWidth - 16)
    const panelHeight = filterPanelRef.current?.offsetHeight || 460
    const spaceBelow = window.innerHeight - rect.bottom - 10
    const spaceAbove = rect.top - 10
    const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow
    const top = openUp
      ? Math.max(8, rect.top - panelHeight - 10)
      : Math.min(window.innerHeight - panelHeight - 8, rect.bottom + 10)
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width))
    setFilterPanelPosition({ top, left, width, placement: openUp ? 'top' : 'bottom' })
  }

  useEffect(() => {
    if (!filterModalOpen) return undefined
    const rafId = window.requestAnimationFrame(updateFilterPanelPosition)
    const onReposition = () => updateFilterPanelPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [filterModalOpen])

  const updateDatePopoverPosition = (field) => {
    const anchorRef = field === 'from' ? fromDateButtonRef : toDateButtonRef
    if (!anchorRef?.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popoverWidth = 270
    const popoverHeight = datePopoverRef.current?.offsetHeight || 320
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openUp = spaceBelow < popoverHeight && spaceAbove > spaceBelow
    const top = openUp ? Math.max(8, rect.top - popoverHeight - 8) : rect.bottom + 8
    const left = Math.min(window.innerWidth - popoverWidth - 8, Math.max(8, rect.left))
    setDatePopoverPos({ top, left })
  }

  useEffect(() => {
    if (!activeDateField) return undefined
    const rafId = window.requestAnimationFrame(() => updateDatePopoverPosition(activeDateField))
    const onReposition = () => updateDatePopoverPosition(activeDateField)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [activeDateField])

  const openDatePicker = (field) => {
    const currentValue = field === 'from' ? draftFromDate : draftToDate
    if (currentValue) {
      const parsed = new Date(`${currentValue}T00:00:00`)
      if (!Number.isNaN(parsed.getTime())) setCalendarMonth(parsed)
    } else {
      setCalendarMonth(new Date())
    }
    setActiveDateField((prev) => (prev === field ? null : field))
  }

  const handleDateSelect = (date) => {
    const nextValue = formatDateForInput(date)
    if (activeDateField === 'from') setDraftFromDate(nextValue)
    if (activeDateField === 'to') setDraftToDate(nextValue)
    setActiveDateField(null)
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      const menuRoot = event.target.closest('[data-followup-action-menu-root="true"]')
      if (!menuRoot) setActionMenuOpenId(null)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setActionMenuOpenId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const fetchFollowUps = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (typeFilter !== 'all') params.followup_type = typeFilter

      const response = await axios.get(`${API_URL}/api/followups/`, { params })
      setFollowups(response.data.followups || [])
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error)
      showToast('Failed to fetch follow-ups: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/followups/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // const fetchSchedulerStatus = async () => {
  //   try {
  //     const response = await axios.get(`${API_URL}/api/followups/scheduler/status`)
  //     setSchedulerStatus(response.data)
  //   } catch (error) {
  //     console.error('Failed to fetch scheduler status:', error)
  //   }
  // }

  const runScheduler = async () => {
    setRunningScheduler(true)
    try {
      const response = await axios.post(`${API_URL}/api/followups/scheduler/run`)
      showToast(`Scheduler completed: ${response.data.successful} sent, ${response.data.failed} failed`, 'success')
      fetchFollowUps()
      fetchStats()
      fetchSchedulerStatus()
    } catch (error) {
      console.error('Failed to run scheduler:', error)
      showToast('Failed to run scheduler: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setRunningScheduler(false)
    }
  }

  const deleteFollowup = async (followupId) => {
    if (!window.confirm('Are you sure you want to delete this follow-up? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/api/followups/${followupId}`)
      showToast('Follow-up deleted successfully', 'success')
      fetchFollowUps()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete follow-up:', error)
      showToast('Failed to delete follow-up: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'sent': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'no_answer': return 'bg-yellow-100 text-yellow-800'
      case 'rescheduled': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock size={16} />
      case 'sent': return <CheckCircle size={16} />
      case 'failed': return <XCircle size={16} />
      case 'cancelled': return <AlertCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <Mail size={16} className="text-blue-600" />
      case 'message': return <MessageSquare size={16} className="text-green-600" />
      case 'whatsapp': return <MessageSquare size={16} className="text-emerald-600" />
      case 'both': return (
        <div className="flex space-x-1">
          <Mail size={12} className="text-blue-600" />
          <MessageSquare size={12} className="text-green-600" />
        </div>
      )
      case 'call': return <Phone size={16} className="text-purple-600" />
      default: return <Mail size={16} />
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = parseApiUtcDate(dateString)
    if (!date) return 'N/A'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatScheduleLabel = (dateString) => {
    const date = parseApiUtcDate(dateString)
    if (!date) return 'N/A'
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  const getLaneForFollowup = (followup) => {
    if (followup.status === 'failed') return 'failed'
    if (followup.status === 'sent') return 'sent'
    if (followup.call_status === 'rescheduled') return 'rescheduled'
    if (followup.status !== 'scheduled') return 'scheduled'

    const scheduledDate = parseApiUtcDate(followup.scheduled_at)
    if (!scheduledDate) return 'scheduled'
    const now = new Date()
    if (scheduledDate < now && !isSameDay(scheduledDate, now)) return 'overdue'
    if (isSameDay(scheduledDate, now)) return 'due_now'
    return 'scheduled'
  }

  const searchedFollowups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return followups
    return followups.filter((item) => {
      const haystack = `${item.lead_name || ''} ${item.lead_email || ''} ${item.followup_type || ''} ${item.status || ''} ${formatScheduleLabel(item.scheduled_at)}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [followups, query])

  const chatbotOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        followups
          .map((item) => item.chatbot_name || item.chatbot || '')
          .filter(Boolean)
      )
    )
    return [{ value: 'all', label: 'All Chatbots' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [followups])

  const preLaneFilteredFollowups = useMemo(() => {
    return searchedFollowups.filter((item) => {
      if (chatbotFilter !== 'all') {
        const chatbotName = item.chatbot_name || item.chatbot || ''
        if (chatbotName !== chatbotFilter) return false
      }

      const scheduledDate = parseApiUtcDate(item.scheduled_at)
      if (fromDate && scheduledDate) {
        const start = new Date(`${fromDate}T00:00:00`)
        if (scheduledDate < start) return false
      }
      if (toDate && scheduledDate) {
        const end = new Date(`${toDate}T23:59:59`)
        if (scheduledDate > end) return false
      }
      return true
    })
  }, [searchedFollowups, chatbotFilter, fromDate, toDate])

  const laneCounts = useMemo(() => {
    const acc = {
      due_now: 0,
      overdue: 0,
      scheduled: 0,
      sent: 0,
      rescheduled: 0,
      failed: 0,
    }
    preLaneFilteredFollowups.forEach((item) => {
      const laneKey = getLaneForFollowup(item)
      acc[laneKey] += 1
    })
    return acc
  }, [preLaneFilteredFollowups])

  const laneFilteredFollowups = useMemo(() => {
    const items = preLaneFilteredFollowups.filter((item) => getLaneForFollowup(item) === lane)
    return [...items].sort((a, b) => {
      if (sortBy === 'name_asc') return String(a.lead_name || '').localeCompare(String(b.lead_name || ''))
      if (sortBy === 'name_desc') return String(b.lead_name || '').localeCompare(String(a.lead_name || ''))
      const da = parseApiUtcDate(a.scheduled_at)?.getTime() || 0
      const db = parseApiUtcDate(b.scheduled_at)?.getTime() || 0
      if (sortBy === 'due_desc') return db - da
      return da - db
    })
  }, [preLaneFilteredFollowups, lane, sortBy])

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(laneFilteredFollowups.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedFollowups = laneFilteredFollowups.slice((safePage - 1) * pageSize, safePage * pageSize)

  const percent = (num, den) => (den > 0 ? `${Math.round((num / den) * 100)}%` : '0%')
  const total = stats?.total_followups || followups.length || 0
  const sentCount = stats?.by_status?.sent || 0
  const failedCount = stats?.failed_count || stats?.by_status?.failed || 0
  const rescheduledCount = laneCounts.rescheduled
  const overdueCount = laneCounts.overdue
  const metricCards = [
    { label: 'On-Time Send Rate', value: percent(sentCount, total) },
    { label: 'Automation Coverage', value: percent((stats?.scheduled_today || 0) + sentCount, total) },
    { label: 'Overdue Rate', value: percent(overdueCount, total) },
    { label: 'Failure Rate', value: percent(failedCount, total) },
    { label: 'Reschedule Rate', value: percent(rescheduledCount, total) },
    { label: 'Send Success Rate', value: percent(sentCount, sentCount + failedCount) },
  ]

  const laneItems = [
    { id: 'due_now', label: 'Due now', color: 'bg-amber-100 text-amber-700' },
    { id: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700' },
    { id: 'scheduled', label: 'Scheduled', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'sent', label: 'Sent', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'rescheduled', label: 'Rescheduled', color: 'bg-violet-100 text-violet-700' },
    { id: 'failed', label: 'Failed', color: 'bg-orange-100 text-orange-700' },
  ]

  return (
    <div className=" pt-6 px-4 md:px-6">
      <ToastContainer />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-gray-500">{card.label}</p>
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border mt-6 border-gray-200 bg-white p-5">
        <div className="">
          <h2 className="text-xl font-bold text-gray-900 mb-1">All Follow Ups</h2>
          <p className="text-sm text-gray-500">Schedule, track, and automate follow-ups to convert leads faster.</p>
        </div>

        <div className=" flex flex-col gap-3 lg:flex-row lg:items-center my-5">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search follow-ups by lead name, email, type, or date..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-teal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            />
          </div>

          <div ref={filterDropdownRef} className="relative">
            <button
              ref={filterTriggerRef}
              type="button"
              onClick={() => {
                setDraftTypeFilter(typeFilter)
                setDraftSortBy(sortBy)
                setDraftChatbotFilter(chatbotFilter)
                setDraftFromDate(fromDate)
                setDraftToDate(toDate)
                setActiveDateField(null)
                setFilterModalOpen((prev) => !prev)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${filterModalOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterModalOpen && (
              createPortal(
                <div
                  ref={filterPanelRef}
                  className="fixed z-40 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
                  style={{
                    top: `${filterPanelPosition.top}px`,
                    left: `${filterPanelPosition.left}px`,
                    width: `${filterPanelPosition.width}px`,
                  }}
                >
                  <h3 className="mb-3 text-xl font-bold" style={{ color: COLORS.BRAND }}>
                    Filter Options
                  </h3>
                  <div className="space-y-3">
                    <SelectDropdown
                      label="Sort by"
                      value={draftSortBy}
                      onChange={setDraftSortBy}
                      options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                    />
                    <SelectDropdown
                      label="Chatbots"
                      value={draftChatbotFilter}
                      onChange={setDraftChatbotFilter}
                      options={chatbotOptions}
                    />
                    <SelectDropdown
                      label="Type"
                      value={draftTypeFilter}
                      onChange={setDraftTypeFilter}
                      options={TYPE_FILTER_OPTIONS.map((option) => ({ value: option.value, label: option.label.replace(' only', '') }))}
                    />
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900">Date Range</label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          ref={fromDateButtonRef}
                          type="button"
                          onClick={() => openDatePicker('from')}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 px-3 text-left text-sm text-gray-900 focus:border-brand-teal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                        >
                          <span className={draftFromDate ? 'text-gray-900' : 'text-gray-400'}>{formatDateDisplay(draftFromDate)}</span>
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          ref={toDateButtonRef}
                          type="button"
                          onClick={() => openDatePicker('to')}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 px-3 text-left text-sm text-gray-900 focus:border-brand-teal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                        >
                          <span className={draftToDate ? 'text-gray-900' : 'text-gray-400'}>{formatDateDisplay(draftToDate)}</span>
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftTypeFilter('all')
                        setDraftSortBy('due_asc')
                        setDraftChatbotFilter('all')
                        setDraftFromDate('')
                        setDraftToDate('')
                        setTypeFilter('all')
                        setSortBy('due_asc')
                        setChatbotFilter('all')
                        setFromDate('')
                        setToDate('')
                        setActiveDateField(null)
                        setFilterModalOpen(false)
                      }}
                      className="rounded-lg border border-brand-teal px-4 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5"
                    >
                      Clear Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter(draftTypeFilter)
                        setSortBy(draftSortBy)
                        setChatbotFilter(draftChatbotFilter)
                        setFromDate(draftFromDate)
                        setToDate(draftToDate)
                        setActiveDateField(null)
                        setFilterModalOpen(false)
                      }}
                      className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-hover"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>,
                document.body
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedFollowUp(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: COLORS.BRAND }}
          >
            <Plus className="h-4 w-4" />
            Schedule Follow Up
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center gap-3 border-b border-gray-100">
          {laneItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLane(item.id)}
              className="inline-flex items-center w-full text-center justify-center gap-2 border-b-2 pb-1.5 text-sm font-semibold"
              style={{
                color: lane === item.id ? COLORS.BRAND : COLORS.GRAY_500,
                borderBottomColor: lane === item.id ? COLORS.BRAND : 'transparent',
              }}
            >
              <span>  {item.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-sm ${item.color}`}> • {laneCounts[item.id]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-100 py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-teal"></div>
            <p className="mt-2 text-sm text-gray-500">Loading follow-ups...</p>
          </div>
        ) : pagedFollowups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">No follow-ups found</p>
            <p className="mt-1 text-sm text-gray-500">Try another filter, or schedule a new follow-up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagedFollowups.map((followup) => (
              <div key={followup.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900 mb-2">{followup.lead_name || 'Unknown Lead'}</p>
                    <p className="text-xs text-gray-500 mb-2">{followup.lead_email || '—'}</p>
                  </div>
                  <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {getLaneForFollowup(followup) === 'due_now' ? 'Due Now' : getLaneForFollowup(followup).replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1.5">{getTypeIcon(followup.followup_type)}<span className="capitalize">{followup.followup_type}</span></span>
                  <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-gray-400" />Chatbot Name</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" />{formatScheduleLabel(followup.scheduled_at)}</span>
                </div>

                <div className="flex items-center gap-2 ">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFollowUp(followup)
                      setIsModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: COLORS.BRAND }}
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFollowUp(followup)
                      setIsModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-brand-teal" />
                    Reschedule
                  </button>
                  <div className="relative" data-followup-action-menu-root="true">
                    <button
                      type="button"
                      onClick={() => setActionMenuOpenId((prev) => (prev === followup.id ? null : followup.id))}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                      title="Actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {actionMenuOpenId === followup.id ? (
                      <div className="absolute right-0 top-[110%] z-20 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFollowUp(followup)
                            setIsModalOpen(true)
                            setActionMenuOpenId(null)
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          <ClipboardList className="h-5 w-5 text-brand-teal" />
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteFollowup(followup.id)
                            setActionMenuOpenId(null)
                          }}
                          className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-3 text-left text-xs font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          <X className="h-5 w-5 text-brand-teal" />
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between pt-4">
          <p className="text-xs text-gray-500">Page {safePage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(6, totalPages) }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className="h-7 min-w-7 rounded-md px-2 text-xs font-semibold"
                style={{
                  backgroundColor: safePage === page ? COLORS.BRAND_ACTIVE_BG : 'transparent',
                  color: safePage === page ? COLORS.BRAND : COLORS.GRAY_600,
                }}
              >
                {String(page).padStart(2, '0')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: COLORS.BRAND }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {activeDateField
        ? createPortal(
            <div
              ref={datePopoverRef}
              className="fixed z-[140] w-[270px] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
              style={{ top: `${datePopoverPos.top}px`, left: `${datePopoverPos.left}px` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  <ChevronLeft size={15} />
                </button>
                <p className="text-xs font-semibold text-gray-800">
                  {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </p>
                <button
                  type="button"
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-gray-500">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <span key={day} className="py-1">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((entry) => {
                  const dateKey = formatDateForInput(entry.date)
                  const selectedDate = activeDateField === 'from' ? draftFromDate : draftToDate
                  const isSelected = dateKey === selectedDate
                  return (
                    <button
                      key={`${dateKey}-${entry.day}`}
                      type="button"
                      onClick={() => handleDateSelect(entry.date)}
                      className={`mx-auto h-7 w-7 rounded-full text-[11px] ${
                        isSelected
                          ? 'bg-brand-teal text-white'
                          : entry.inCurrentMonth
                            ? 'text-gray-800 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {entry.day}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Scheduler Status - Disabled (using FastAPI scheduler) */}
      {/* {schedulerStatus && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Scheduler Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status Counts:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(schedulerStatus.status_counts).map(([status, count]) => (
                  <span key={status} className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming (Next 24h):</p>
              <div className="mt-1">
                {schedulerStatus.upcoming_followups.length > 0 ? (
                  schedulerStatus.upcoming_followups.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {item.lead_name} - {new Date(item.scheduled_at).toLocaleString()}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No upcoming follow-ups</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Follow-ups List */}
      {/* <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Follow-ups</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading follow-ups...</p>
          </div>
        ) : followups.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No follow-ups</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first follow-up.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 gradient-bg text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                <Plus size={16} className="mr-2" />
                Create Follow-Up
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {followups.map((followup) => (
                  <tr key={followup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {followup.lead_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {followup.lead_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(followup.followup_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {followup.followup_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(followup.scheduled_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(followup.status)}`}>
                        {getStatusIcon(followup.status)}
                        <span className="ml-1 capitalize">{followup.status}</span>
                      </span>
                      {followup.sent_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Sent: {formatDateTime(followup.sent_at)}
                        </div>
                      )}
                      {followup.call_completed_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed: {formatDateTime(followup.call_completed_at)}
                        </div>
                      )}
                      {followup.call_status && (
                        <div className="text-xs text-purple-600 mt-1">
                          Call: {followup.call_status.replace('_', ' ')}
                        </div>
                      )}
                      {followup.error_message && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={followup.error_message}>
                          Error: {followup.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedFollowUp(followup)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFollowup(followup.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> */}

      {/* Follow-Up Modal */}
      {isModalOpen && (
        <FollowUpModal
          followup={selectedFollowUp}
          defaultFollowupType={selectedFollowUp?.followup_type || 'call'}
          uiVariant="followups"
          onClose={() => {
            setIsModalOpen(false)
            setSelectedFollowUp(null)
          }}
          onSave={() => {
            setIsModalOpen(false)
            setSelectedFollowUp(null)
            fetchFollowUps()
            fetchStats()
          }}
        />
      )}
    </div>
  )
}