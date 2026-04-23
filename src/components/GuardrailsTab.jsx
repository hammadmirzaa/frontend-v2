import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pencil, Plus, Shield, SlidersHorizontal, Trash2 } from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import Modal from './Modal'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import {
  Button,
  DateRangeFilterField,
  GuardrailFormModal,
  Pagination,
  SearchInput,
  SelectDropdown,
  Table,
} from './ui'
import { formatDateDMY } from '../utils/formatDateDMY'
import { COLORS } from '../lib/designTokens'
import { cycleTableSort } from '../utils/tableSort'

const API_URL = config.API_URL
const GUARDRAILS_PAGE_SIZE = 6

const initialFormState = {
  id: null,
  mode: 'create',
  name: '',
  description: '',
  chatbot_id: '',
  applyTo: 'all',
  allowed_topics: [],
  denied_topics: [],
  content_restrictions: {
    no_pii: false,
    no_financial: false,
    no_medical: false,
    no_legal: false,
    custom_restriction: '',
  },
  status: 'active',
}

export default function GuardrailsTab() {
  const [guardrails, setGuardrails] = useState([])
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const filterMenuRef = useRef(null)
  const [guardrailToDelete, setGuardrailToDelete] = useState(null)
  const [query, setQuery] = useState('')
  /** Draft values in the filter popover (applied only after "Apply Filters"). */
  const [filterLinkedChatbot, setFilterLinkedChatbot] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  /** Applied filters driving the table. */
  const [appliedLinkedChatbot, setAppliedLinkedChatbot] = useState('all')
  const [appliedStatus, setAppliedStatus] = useState('all')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [page, setPage] = useState(1)
  const [tableSort, setTableSort] = useState({ column: null, dir: null })
  const [topicInput, setTopicInput] = useState({ allowed: '', denied: '' })
  const [form, setForm] = useState(initialFormState)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchGuardrails()
    fetchChatbots()
  }, [])

  useEffect(() => {
    if (!filterMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (event.target?.closest?.('[role="listbox"]')) return
      if (event.target?.closest?.('[data-date-range-filter-ui]')) return
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterMenuOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFilterMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [filterMenuOpen])

  /** When opening the filter panel, reset draft fields to match what is currently applied. */
  useEffect(() => {
    if (!filterMenuOpen) return
    setFilterLinkedChatbot(appliedLinkedChatbot)
    setFilterStatus(appliedStatus)
    setFilterFromDate(appliedFromDate)
    setFilterToDate(appliedToDate)
  }, [filterMenuOpen])

  const fetchGuardrails = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/guardrails/`)
      setGuardrails(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      showToast('Failed to load guardrails', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchChatbots = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(Array.isArray(response.data) ? response.data : [])
    } catch {
      setChatbots([])
    }
  }

  const openCreateModal = () => {
    setForm(initialFormState)
    setTopicInput({ allowed: '', denied: '' })
    setEditorOpen(true)
  }

  const openEditModal = (guardrail) => {
    setForm({
      id: guardrail.id,
      mode: 'edit',
      name: guardrail.name || '',
      description: guardrail.description || '',
      chatbot_id: guardrail.chatbot_id || '',
      applyTo: guardrail.chatbot_id ? 'linked' : 'all',
      allowed_topics: Array.isArray(guardrail.allowed_topics) ? guardrail.allowed_topics : [],
      denied_topics: Array.isArray(guardrail.denied_topics) ? guardrail.denied_topics : [],
      content_restrictions: {
        no_pii: Boolean(guardrail.content_restrictions?.no_pii),
        no_financial: Boolean(guardrail.content_restrictions?.no_financial),
        no_medical: Boolean(guardrail.content_restrictions?.no_medical),
        no_legal: Boolean(guardrail.content_restrictions?.no_legal),
        custom_restriction: guardrail.content_restrictions?.custom_restriction || '',
      },
      status: guardrail.is_active === false ? 'inactive' : 'active',
    })
    setTopicInput({ allowed: '', denied: '' })
    setEditorOpen(true)
  }

  const handleModalChange = (field, value) => {
    if (field === 'name' || field === 'applyTo' || field === 'status') {
      setForm((prev) => ({ ...prev, [field]: value }))
      if (field === 'applyTo' && value === 'all') {
        setForm((prev) => ({ ...prev, applyTo: 'all', chatbot_id: '' }))
      }
      return
    }
    if (field === 'customRestriction') {
      setForm((prev) => ({
        ...prev,
        content_restrictions: { ...prev.content_restrictions, custom_restriction: value },
      }))
      return
    }
    if (field === 'restrictPii' || field === 'restrictFinancial' || field === 'restrictMedical' || field === 'restrictLegal') {
      const keyMap = {
        restrictPii: 'no_pii',
        restrictFinancial: 'no_financial',
        restrictMedical: 'no_medical',
        restrictLegal: 'no_legal',
      }
      setForm((prev) => ({
        ...prev,
        content_restrictions: { ...prev.content_restrictions, [keyMap[field]]: Boolean(value) },
      }))
    }
  }

  const handleTopicInputChange = (type, value) => {
    setTopicInput((prev) => ({ ...prev, [type]: value }))
  }

  const handleAddTopic = (type) => {
    const value = topicInput[type].trim()
    if (!value) return
    const key = type === 'allowed' ? 'allowed_topics' : 'denied_topics'
    setForm((prev) => {
      if (prev[key].includes(value)) return prev
      return { ...prev, [key]: [...prev[key], value] }
    })
    setTopicInput((prev) => ({ ...prev, [type]: '' }))
  }

  const handleRemoveTopic = (type, topic) => {
    const key = type === 'allowed' ? 'allowed_topics' : 'denied_topics'
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((t) => t !== topic) }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Please enter a guardrail name', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        chatbot_id: form.applyTo === 'all' ? null : (form.chatbot_id || null),
        allowed_topics: form.allowed_topics,
        denied_topics: form.denied_topics,
        content_restrictions: form.content_restrictions,
        is_active: form.status === 'active',
      }
      if (form.mode === 'edit' && form.id) {
        await axios.put(`${API_URL}/api/guardrails/${form.id}`, payload)
        showToast('Guardrail updated successfully', 'success')
      } else {
        await axios.post(`${API_URL}/api/guardrails/`, payload)
        showToast('Guardrail created successfully', 'success')
      }
      await fetchGuardrails()
      setEditorOpen(false)
    } catch (error) {
      showToast(`Failed to save guardrail: ${error.response?.data?.detail || error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!guardrailToDelete) return
    setDeleting(true)
    try {
      await axios.delete(`${API_URL}/api/guardrails/${guardrailToDelete.id}`)
      await fetchGuardrails()
      showToast('Guardrail deleted successfully', 'success')
      setDeleteModalOpen(false)
      setGuardrailToDelete(null)
    } catch {
      showToast('Failed to delete guardrail', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredGuardrails = guardrails.filter((g) => {
    const matchesSearch = (g.name || '').toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus =
      appliedStatus === 'all' ||
      (appliedStatus === 'active' ? Boolean(g.is_active) : !Boolean(g.is_active))
    const matchesLinked =
      appliedLinkedChatbot === 'all' ||
      (appliedLinkedChatbot === 'global'
        ? !g.chatbot_id
        : g.chatbot_id === appliedLinkedChatbot)

    const dateValue = g.updated_at || g.created_at
    const rowDate = dateValue ? new Date(dateValue) : null
    const from = appliedFromDate ? new Date(`${appliedFromDate}T00:00:00`) : null
    const to = appliedToDate ? new Date(`${appliedToDate}T23:59:59`) : null
    const matchesDate = !rowDate || ((!from || rowDate >= from) && (!to || rowDate <= to))

    return matchesSearch && matchesStatus && matchesLinked && matchesDate
  })

  const sortedGuardrails = useMemo(() => {
    const list = [...filteredGuardrails]
    const { column: sortKey, dir: sortDir } = tableSort
    if (!sortKey || !sortDir) return list
    const mult = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (sortKey === 'updated') {
        const da = new Date(a.updated_at || a.created_at || 0).getTime()
        const db = new Date(b.updated_at || b.created_at || 0).getTime()
        return (da - db) * mult
      }
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }) * mult
    })
    return list
  }, [filteredGuardrails, tableSort])

  const totalPages = Math.max(1, Math.ceil(sortedGuardrails.length / GUARDRAILS_PAGE_SIZE))

  const paginatedGuardrails = useMemo(() => {
    const start = (page - 1) * GUARDRAILS_PAGE_SIZE
    return sortedGuardrails.slice(start, start + GUARDRAILS_PAGE_SIZE)
  }, [sortedGuardrails, page])

  useEffect(() => {
    setPage(1)
  }, [query, appliedLinkedChatbot, appliedStatus, appliedFromDate, appliedToDate])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const onSortClick = useCallback((columnId) => {
    if (columnId !== 'name' && columnId !== 'updated') return
    setTableSort((prev) => cycleTableSort(columnId, prev))
    setPage(1)
  }, [])

  const handleApplyFilters = () => {
    setAppliedLinkedChatbot(filterLinkedChatbot)
    setAppliedStatus(filterStatus)
    setAppliedFromDate(filterFromDate)
    setAppliedToDate(filterToDate)
    setFilterMenuOpen(false)
  }

  const handleClearFilters = () => {
    setFilterLinkedChatbot('all')
    setFilterStatus('all')
    setFilterFromDate('')
    setFilterToDate('')
    setAppliedLinkedChatbot('all')
    setAppliedStatus('all')
    setAppliedFromDate('')
    setAppliedToDate('')
  }

  const columns = [
    { id: 'name', label: 'Name', accessor: 'name', sortable: true },
    {
      id: 'linked',
      label: 'Linked Chatbot',
      render: (row) => {
        const chatbot = chatbots.find((c) => c.id === row.chatbot_id)
        return chatbot?.name || 'All chatbots'
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
          style={row.is_active ? { backgroundColor: '#e8f9ee', color: '#28a745' } : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'updated',
      label: 'Last Updated',
      sortable: true,
      render: (row) => formatDateDMY(row.updated_at || row.created_at),
    },
    {
      id: 'actions',
      label: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-md p-1.5 text-gray-800 transition-colors hover:bg-gray-100"
            aria-label="Edit guardrail"
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => {
              setGuardrailToDelete(row)
              setDeleteModalOpen(true)
            }}
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
            aria-label="Delete guardrail"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ToastContainer />

      <GuardrailFormModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSave}
        submitting={saving}
        mode={form.mode}
        form={{
          name: form.name,
          applyTo: form.applyTo,
          status: form.status,
          restrictPii: form.content_restrictions.no_pii,
          restrictFinancial: form.content_restrictions.no_financial,
          restrictMedical: form.content_restrictions.no_medical,
          restrictLegal: form.content_restrictions.no_legal,
          customRestriction: form.content_restrictions.custom_restriction,
        }}
        onChange={handleModalChange}
        description={form.description}
        onDescriptionChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
        chatbotId={form.chatbot_id}
        chatbotOptions={chatbots}
        onChatbotChange={(value) =>
          setForm((prev) => ({
            ...prev,
            chatbot_id: value,
            applyTo: value ? 'linked' : 'all',
          }))
        }
        allowedTopics={form.allowed_topics}
        deniedTopics={form.denied_topics}
        topicInput={topicInput}
        onTopicInputChange={handleTopicInputChange}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setGuardrailToDelete(null)
        }}
        title="Delete Guardrail"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{guardrailToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setGuardrailToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner size="sm" className="text-white" /> : null}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="h-full rounded-lg shadow-lg">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Guardrails & Rules</h2>
              <p className="mt-1 text-sm text-gray-500">Define what your bot can and cannot share</p>
            </div>
            <Button type="button" variant="primary" className="shrink-0 gap-2 py-3 shadow-sm !rounded-xl" onClick={openCreateModal}>
              Add new guardrail
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading guardrails...</div>
          ) : guardrails.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No guardrails yet"
              description="Create your first guardrail to define content rules for your chatbots."
            >
              <div className="mt-6">
                <Button type="button" variant="primary" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Create Guardrail
                </Button>
              </div>
            </EmptyState>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Guardrails</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage rules that control what your chatbots can and can&apos;t do.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-[240px]" />
                  <div ref={filterMenuRef} className="relative">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      onClick={() => setFilterMenuOpen((open) => !open)}
                      aria-expanded={filterMenuOpen}
                      aria-haspopup="dialog"
                      aria-controls="guardrails-filter-panel"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                      Filters
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>

                    {filterMenuOpen ? (
                      <div
                        id="guardrails-filter-panel"
                        role="dialog"
                        aria-label="Filter options"
                        className="absolute right-0 top-full z-50 mt-2 flex w-[min(calc(100vw-2rem),22rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96"
                      >
                        <div className="max-h-[min(60vh,22rem)] min-h-0 flex-1 overflow-y-auto p-4">
                          <div className="space-y-5">
                            <h3 className="text-base font-bold" style={{ color: COLORS.BRAND }}>
                              Filter Options
                            </h3>

                            <SelectDropdown
                              label="Linked Chatbots"
                              value={filterLinkedChatbot}
                              onChange={setFilterLinkedChatbot}
                              options={[
                                { value: 'all', label: 'All Chatbots' },
                                { value: 'global', label: 'Global (All Chatbots)' },
                                ...chatbots.map((chatbot) => ({ value: chatbot.id, label: chatbot.name })),
                              ]}
                            />

                            <div>
                              <p className="mb-2 text-sm font-bold text-gray-900">Chatbots</p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: 'all', label: 'All' },
                                  { id: 'active', label: 'Active' },
                                  { id: 'inactive', label: 'Inactive' },
                                ].map((item) => {
                                  const selected = filterStatus === item.id
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      className="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                                      style={{
                                        borderColor: selected ? COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG  : COLORS.GRAY_200,
                                        color: selected ? COLORS.BRAND : COLORS.GRAY_600,
                                        backgroundColor: selected ? COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG : '#ffffff',
                                      }}
                                      onClick={() => setFilterStatus(item.id)}
                                    >
                                      {item.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <DateRangeFilterField
                              dateFrom={filterFromDate}
                              dateTo={filterToDate}
                              onChange={(from, to) => {
                                setFilterFromDate(from)
                                setFilterToDate(to)
                              }}
                              label="Date Range"
                              placeholder="Select date range"
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-3">
                          <Button
                            type="button"
                            variant="outline"
                            className='w-full'
                            onClick={handleClearFilters}
                          >
                            Clear Filters
                          </Button>
                          <Button type="button" variant="primary" className='w-full' onClick={handleApplyFilters}>
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {filteredGuardrails.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">No guardrails match your search or filters.</div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <Table
                    columns={columns}
                    data={paginatedGuardrails}
                    keyExtractor={(row) => row.id}
                    minWidth="900px"
                    onSortClick={onSortClick}
                    sortColumnId={tableSort.column}
                    sortDirection={tableSort.dir}
                    className="pt-0 sm:pt-0 [&>div]:pt-0"
                  />
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="border-t border-gray-100 px-4 pb-4 sm:px-6"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

