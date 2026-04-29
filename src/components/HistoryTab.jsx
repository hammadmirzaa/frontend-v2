import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
    MessageCircle,
    MessagesSquare,
    X,
    ChevronDown,
    User,
    SlidersHorizontal,
    Bot,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import ConversationDetailView from './ConversationDetailView'
import EmptyState from './EmptyState'
import { SearchInput, Button, FilterButton, SelectDropdown, DateRangeFilterField, Pagination } from './ui'
import { COLORS } from '../lib/designTokens'
import { cn } from '../utils/cn'

const API_URL = config.API_URL

const CHATBOT_SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'name', label: 'Name (A–Z)' },
]

function getConversationRowTitle(conversation) {
    if (conversation.semantic_tags?.length) {
        return String(conversation.semantic_tags[0]).replace(/_/g, ' ')
    }
    if (conversation.matchedContent) {
        const t = String(conversation.matchedContent).trim()
        return t.length > 56 ? `${t.slice(0, 56)}…` : t
    }
    return 'Conversation'
}

function formatChatbotCreatedDate(value) {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent', hint: 'Newest activity first' },
    { value: 'oldest', label: 'Oldest first', hint: 'Chronological order' },
    { value: 'most_messages', label: 'Most messages', hint: 'Busiest threads' },
]

const SOURCE_OPTIONS = [
    { value: '', label: 'All sources', hint: 'Playground and plugin' },
    { value: 'playground', label: 'Playground', hint: 'Dashboard testing' },
    { value: 'plugin', label: 'Plugin', hint: 'Embedded widget' },
]

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses', hint: 'Active and abandoned' },
    { value: 'active', label: 'Active', hint: 'Ongoing sessions' },
    { value: 'abandoned', label: 'Abandoned', hint: 'Ended or idle' },
]

/** Dropdown labels aligned with Filter Options UI (conversation list). */
const SORT_OPTIONS_FOR_DROPDOWN = SORT_OPTIONS.map((o) => ({
    value: o.value,
    label:
        o.value === 'recent'
            ? 'Most Recent (default)'
            : o.value === 'oldest'
              ? 'Oldest first'
              : 'Most messages',
}))

const SOURCE_DROPDOWN_OPTIONS = SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
const STATUS_DROPDOWN_OPTIONS = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

export default function HistoryTab() {
    const [conversations, setConversations] = useState([])
    const [chatbots, setChatbots] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterDropdownRef = useRef(null)
    const searchDebounceRef = useRef(null)
    const skipFetchOnPageRef = useRef(false)
    const [chatbotSidebarQuery, setChatbotSidebarQuery] = useState('')
    const [chatbotSort, setChatbotSort] = useState('recent')
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { showToast, ToastContainer } = useToast()

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const pageSize = 20

    // Filters
    const [filters, setFilters] = useState({
        sortBy: 'recent',
        dateFrom: '',
        dateTo: '',
        chatbotId: '',
        source: '',
        status: ''
    })

    // Applied filters (only applied when user clicks Apply)
    const [appliedFilters, setAppliedFilters] = useState({
        sortBy: 'recent',
        dateFrom: '',
        dateTo: '',
        chatbotId: '',
        source: '',
        status: ''
    })

    // Fetch chatbots for filter dropdown
    useEffect(() => {
        fetchChatbots()
    }, [])

    useEffect(() => {
        if (!isFilterOpen) return undefined
        const onPointerDown = (event) => {
            const t = event.target
            if (filterDropdownRef.current?.contains(t)) return
            if (t.closest?.('[role="listbox"]')) return
            if (t.closest?.('[data-date-range-filter-ui]')) return
            setIsFilterOpen(false)
        }
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setIsFilterOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [isFilterOpen])

    const filteredChatbots = useMemo(() => {
        let list = Array.isArray(chatbots) ? [...chatbots] : []
        const q = chatbotSidebarQuery.trim().toLowerCase()
        if (q) {
            list = list.filter((c) => (c.name || '').toLowerCase().includes(q))
        }
        if (chatbotSort === 'name') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        } else {
            list.sort(
                (a, b) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
        }
        return list
    }, [chatbots, chatbotSidebarQuery, chatbotSort])

    const chatbotFilterDropdownOptions = useMemo(
        () => [{ value: '', label: 'All Chatbots' }, ...chatbots.map((c) => ({ value: c.id, label: c.name || 'Chatbot' }))],
        [chatbots]
    )

    // Fetch conversations when page or applied filters change
    useEffect(() => {
        if (skipFetchOnPageRef.current) {
            skipFetchOnPageRef.current = false
            return
        }
        fetchConversations()
    }, [currentPage])

    useEffect(() => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
        }

        skipFetchOnPageRef.current = true
        setCurrentPage(1)

        searchDebounceRef.current = setTimeout(() => {
            fetchConversations({ pageOverride: 1 })
        }, 250)

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current)
            }
        }
    }, [searchQuery, appliedFilters])

    const fetchChatbots = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/chatbots/`)
            setChatbots(response.data)
        } catch (error) {
            console.error('Failed to fetch chatbots:', error)
        }
    }

    const fetchConversations = async ({ pageOverride } = {}) => {
        setLoading(true)
        try {
            const pageToFetch = pageOverride ?? currentPage
            // Build query params
            const params = {
                page: pageToFetch,
                page_size: pageSize,
                sort_by: appliedFilters.sortBy
            }

            if (appliedFilters.chatbotId) {
                params.chatbot_id = appliedFilters.chatbotId
            }

            if (appliedFilters.dateFrom) {
                params.date_from = new Date(appliedFilters.dateFrom).toISOString()
            }

            if (appliedFilters.dateTo) {
                params.date_to = new Date(appliedFilters.dateTo).toISOString()
            }

            if (appliedFilters.source) {
                params.source = appliedFilters.source
            }

            if (appliedFilters.status) {
                params.status = appliedFilters.status
            }

            if (searchQuery.trim()) {
                // Use search endpoint for searching - default to semantic search
                const searchResponse = await axios.post(`${API_URL}/api/conversations/search`, {
                    query: searchQuery,
                    top_k: pageSize,
                    chatbot_id: appliedFilters.chatbotId || null,
                    date_from: appliedFilters.dateFrom ? new Date(appliedFilters.dateFrom).toISOString() : null,
                    date_to: appliedFilters.dateTo ? new Date(appliedFilters.dateTo).toISOString() : null
                })

                const results = searchResponse.data.results || []
                setConversations(results.map(r => ({
                    ...r.session,
                    score: r.score,
                    matchedContent: r.matched_content
                })))
                setTotalPages(1)
                setTotalItems(results.length)
            } else {
                // Use list endpoint for browsing
                const response = await axios.get(`${API_URL}/api/conversations/`, { params })
                setConversations(response.data.items || [])
                setTotalPages(response.data.pages || 1)
                setTotalItems(response.data.total || 0)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
            showToast('Failed to fetch conversations: ' + (error.response?.data?.detail || error.message), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters })
        setCurrentPage(1)
        setIsFilterOpen(false)
    }

    const handleResetFilters = () => {
        const defaultFilters = {
            sortBy: 'recent',
            dateFrom: '',
            dateTo: '',
            chatbotId: '',
            source: '',
            status: ''
        }
        setFilters(defaultFilters)
        setAppliedFilters(defaultFilters)
        setCurrentPage(1)
        setIsFilterOpen(false)
    }

    const handleConversationClick = (conversation) => {
        setSelectedConversation(conversation)
        setIsModalOpen(true)
        setIsFilterOpen(false)
    }

    const handleSidebarChatbotSelect = (chatbotId) => {
        setAppliedFilters((f) => ({ ...f, chatbotId: chatbotId }))
        setFilters((f) => ({ ...f, chatbotId: chatbotId }))
        setCurrentPage(1)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedConversation(null)
    }

    /** Close detail and show conversations across all chatbots */
    const handleBreadcrumbConversations = () => {
        handleCloseModal()
        handleSidebarChatbotSelect('')
    }

    /** Close detail and ensure the list is filtered to this conversation’s chatbot */
    const handleBreadcrumbChatbot = () => {
        const chatbotId = selectedConversation?.chatbot_id
        handleCloseModal()
        if (chatbotId) handleSidebarChatbotSelect(chatbotId)
    }

    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'Unknown'
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffMinutes = Math.floor(diffSeconds / 60)
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffSeconds < 60) return `${diffSeconds} sec ago`
        if (diffMinutes < 60) return `${diffMinutes} min ago`
        if (diffHours < 24) return `${diffHours} hr ago`
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getChatbotName = (chatbotId) => {
        const chatbot = chatbots.find(c => c.id === chatbotId)
        return chatbot?.name || 'Unknown Chatbot'
    }

    const renderPagination = () => {
        if (totalPages <= 1) return null

        return (
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="w-full !px-0 !pt-0"
                />
            </div>
        )
    }

    const conversationsPanelTitle = appliedFilters.chatbotId
        ? `${getChatbotName(appliedFilters.chatbotId)} Conversations`
        : 'All Conversations'

    const appliedFilterCount =
        (appliedFilters.sortBy !== 'recent' ? 1 : 0) +
        (appliedFilters.dateFrom ? 1 : 0) +
        (appliedFilters.dateTo ? 1 : 0) +
        (appliedFilters.chatbotId ? 1 : 0) +
        (appliedFilters.source ? 1 : 0) +
        (appliedFilters.status ? 1 : 0)

    return (
        <>
            <ToastContainer />
            {isModalOpen && selectedConversation ? (
                <ConversationDetailView
                    sessionId={selectedConversation.session_id}
                    chatbotName={getChatbotName(selectedConversation.chatbot_id)}
                    conversationTitle={getConversationRowTitle(selectedConversation)}
                    onNavigateConversations={handleBreadcrumbConversations}
                    onNavigateChatbot={handleBreadcrumbChatbot}
                />
            ) : (
            <div className={`flex max-h-[calc(100vh-7rem)] ${conversations.length === 0 ? "h-full min-h-0" : ""} flex-col overflow-hidden p-2 sm:p-4`}>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
                    {/* Chatbots — master list */}
                    <aside className="flex w-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:max-h-full lg:w-[300px] lg:max-w-[340px]">
                        <div className="border-b border-gray-100 px-4 py-3">
                            <h2 className="text-xl font-bold text-gray-900">Chatbots</h2>
                        </div>
                        <div className="space-y-2.5 px-4 pb-3 pt-3">
                            <SearchInput
                                placeholder="Search chatbots..."
                                value={chatbotSidebarQuery}
                                onChange={(e) => setChatbotSidebarQuery(e.target.value)}
                                className="max-w-none"
                                inputClassName="h-9 text-xs placeholder:text-[11px]"
                            />
                            <SelectDropdown
                                value={chatbotSort}
                                onChange={setChatbotSort}
                                options={CHATBOT_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                                className="[&_label]:text-xs [&_button]:py-2 [&_button]:text-xs"
                            />
                        </div>
                        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-2 pb-4 [-webkit-overflow-scrolling:touch] max-h-[min(520px,45vh)] sm:max-h-[min(560px,55vh)] lg:max-h-none">
                            <li className="px-1">
                                <button
                                    type="button"
                                    onClick={() => handleSidebarChatbotSelect('')}
                                    className={cn(
                                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                                        appliedFilters.chatbotId === ''
                                            ? COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG
                                            : 'hover:bg-gray-50'
                                    )}
                                >
                                        <img src="/svgs/conversations/chatbott.svg" alt="Chatbot" className="h-9 w-9 object-contain" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900">All chatbots</p>
                                        <p className="truncate text-[10px] text-gray-500">Every conversation</p>
                                    </div>
                                </button>
                            </li>
                            {filteredChatbots.map((cb) => {
                                const selected = appliedFilters.chatbotId === cb.id
                                return (
                                    <li key={cb.id} className="px-1">
                                        <button
                                            type="button"
                                            onClick={() => handleSidebarChatbotSelect(cb.id)}
                                            className={cn(
                                                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                                                selected
                                                    ? 'bg-brand-teal/[0.08] ring-1 ring-brand-teal/15'
                                                    : 'hover:bg-gray-50'
                                            )}
                                        >
                                            <div
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50"
                                                style={selected ? { backgroundColor: COLORS.BRAND_ACTIVE_BG } : undefined}
                                            >
                                                <img src="/svgs/conversations/chatbott.svg" alt="Chatbot" className="h-9 w-9 object-contain" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900">{cb.name || 'Chatbot'}</p>
                                                <p className="truncate text-[10px] text-gray-500">
                                                    Created on: {formatChatbotCreatedDate(cb.created_at)}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </aside>

                    {/* Conversations */}
                    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3">
                            <h2 className="text-xl font-bold text-gray-900">{conversationsPanelTitle}</h2>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                                Manage all your ongoing chats and messages
                            </p>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2 border-b border-gray-100 px-4 py-2.5">
                            <SearchInput
                                placeholder="Search conversations…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-none min-w-0 flex-1"
                                inputClassName="h-9 text-xs placeholder:text-[11px]"
                            />
                            <div ref={filterDropdownRef} className="relative shrink-0">
                                <FilterButton
                                type="button"
                                id="history-filters-trigger"
                                aria-haspopup="dialog"
                                aria-expanded={isFilterOpen}
                                aria-controls={isFilterOpen ? 'history-filter-panel' : undefined}
                                onClick={() => setIsFilterOpen((v) => !v)}
                                active={appliedFilterCount > 0}
                                className="h-9 shrink-0 px-3 text-xs"
                            >
                                    <img src="/svgs/followups/filter.svg" alt="Filters" className="h-4 w-4 object-contain" />
                                    Filters
                                    <ChevronDown
                                        className={cn(
                                            'h-3.5 w-3.5 text-gray-400 transition-transform',
                                            isFilterOpen && 'rotate-180'
                                        )}
                                    />
                                    {appliedFilterCount > 0 ? (
                                        <span
                                            className="flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white"
                                            style={{ backgroundColor: COLORS.BRAND }}
                                        >
                                            {appliedFilterCount}
                                        </span>
                                    ) : null}
                                </FilterButton>

                                {isFilterOpen ? (
                                    <div
                                        id="history-filter-panel"
                                        role="dialog"
                                        aria-modal="false"
                                        aria-labelledby="history-filter-title"
                                        className="absolute right-0 top-[calc(100%+6px)] z-[130] flex max-h-[min(70vh,560px)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-gray-900/5"
                                    >
                                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                                            <h3 id="history-filter-title" className="text-sm font-bold" style={{ color: COLORS.BRAND }}>
                                                Filter Options
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsFilterOpen(false)}
                                                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                                aria-label="Close filters"
                                            >
                                                <X size={18} strokeWidth={2} />
                                            </button>
                                        </div>

                                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                                            <SelectDropdown
                                                label="Sort by"
                                                value={filters.sortBy}
                                                onChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
                                                options={SORT_OPTIONS_FOR_DROPDOWN}
                                                className="[&_label]:text-xs [&_button]:min-h-10 [&_button]:py-2 [&_button]:text-xs"
                                            />
                                            <SelectDropdown
                                                label="Chatbots"
                                                value={filters.chatbotId}
                                                onChange={(v) => setFilters((f) => ({ ...f, chatbotId: v }))}
                                                options={chatbotFilterDropdownOptions}
                                                className="[&_label]:text-xs [&_button]:min-h-10 [&_button]:py-2 [&_button]:text-xs"
                                            />
                                            <DateRangeFilterField
                                                dateFrom={filters.dateFrom}
                                                dateTo={filters.dateTo}
                                                onChange={(from, to) =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        dateFrom: from,
                                                        dateTo: to,
                                                    }))
                                                }
                                            />
                                            <SelectDropdown
                                                label="Source"
                                                value={filters.source}
                                                onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
                                                options={SOURCE_DROPDOWN_OPTIONS}
                                                className="[&_label]:text-xs [&_button]:min-h-10 [&_button]:py-2 [&_button]:text-xs"
                                            />
                                            <SelectDropdown
                                                label="Status"
                                                value={filters.status}
                                                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                                                options={STATUS_DROPDOWN_OPTIONS}
                                                className="[&_label]:text-xs [&_button]:min-h-10 [&_button]:py-2 [&_button]:text-xs"
                                            />
                                        </div>

                                        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-gray-100 px-4 py-3">
                                            <Button type="button" variant="outline" className="py-2.5 text-xs font-semibold" onClick={handleResetFilters}>
                                                Clear Filters
                                            </Button>
                                            <Button type="button" variant="primary" className="py-2.5 text-xs font-semibold" onClick={handleApplyFilters}>
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <p className="border-b border-gray-50 px-4 py-1.5 text-xs text-gray-400">
                            Press Enter or Search for semantic search. Filters apply to the list below.
                        </p>

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                                {loading ? (
                                    <div className="flex min-h-[220px] items-center justify-center">
                                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-brand-teal" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <EmptyState
                                        icon="/conversations/chatempty"
                                        title="No conversations yet"
                                        description="Once you begin a conversation, it will appear here."
                                        className="[&_h3]:text-sm [&_p]:text-xs"
                                    />
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {conversations.map((conversation) => {
                                            const chatbotTitle = getChatbotName(conversation.chatbot_id)
                                            const rowTitle = getConversationRowTitle(conversation)
                                            const msgCount = conversation.message_count || 0
                                            return (
                                                <li key={conversation.session_id || conversation.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConversationClick(conversation)}
                                                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30"
                                                    >
                                                        <div
                                                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                            style={{ backgroundColor: COLORS.BRAND_ACTIVE_BG }}
                                                        >
                                                            <MessagesSquare
                                                                className="h-4 w-4"
                                                                style={{ color: COLORS.BRAND }}
                                                                strokeWidth={2}
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-gray-900">{rowTitle}</p>
                                                            <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px] text-gray-500">
                                                                <span className="truncate">{chatbotTitle}</span>
                                                                <span className="text-gray-300" aria-hidden>
                                                                    •
                                                                </span>
                                                                <span className="inline-flex items-center gap-0.5 tabular-nums">
                                                                    <img src="/svgs/followups/emailnsms.svg" alt="Message" className="h-3 w-3 text-gray-400 object-contain" />
                                                                    {msgCount}
                                                                </span>
                                                                <span className="text-gray-300" aria-hidden>
                                                                    •
                                                                </span>
                                                                <span className="inline-flex items-center gap-0.5">
                                                                    <User className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                                                                    User
                                                                </span>
                                                            </p>
                                                            {conversation.matchedContent ? (
                                                                <p className="mt-1 line-clamp-2 text-[11px] italic text-gray-500">
                                                                    &ldquo;{conversation.matchedContent}&rdquo;
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-gray-400">
                                                            {formatRelativeTime(conversation.updated_at || conversation.created_at)}
                                                        </span>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                            {renderPagination()}
                        </div>
                    </section>
                </div>

            </div>
            )}
        </>
    )
}
