import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Upload,
  PenSquare,
  AlertCircle,
  FileText,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import Modal from './Modal'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import ManualKnowledgeEntryView from './ManualKnowledgeEntryView'
import { SearchInput, Table, Pagination, Button, SelectDropdown, DateRangeFilterField } from './ui'
import { formatDateDMY } from '../utils/formatDateDMY'
import { formatApiErrorDetail } from '../utils/formatApiError'
import { cn } from '../utils/cn'
import { COLORS } from '../lib/designTokens'
import { cycleTableSort } from '../utils/tableSort'

const API_URL = config.API_URL

const ACCEPT_UPLOAD =
  '.pdf,.doc,.docx,.txt,.csv,.tsv,.xls,.xlsx,.json'

const PAGE_SIZE = 10

const FILE_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Files' },
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'DOC / DOCX' },
  { value: 'txt', label: 'TXT' },
  { value: 'sheet', label: 'Spreadsheet (CSV, XLS, …)' },
  { value: 'url', label: 'URL' },
]

function documentMatchesFileType(doc, key) {
  if (!key) return true
  if (key === 'url') return doc.source_type === 'url'
  if (doc.source_type === 'url') return false
  const ext = (doc.filename?.split('.').pop() || '').toLowerCase()
  switch (key) {
    case 'pdf':
      return ext === 'pdf'
    case 'doc':
      return ext === 'doc' || ext === 'docx'
    case 'txt':
      return ext === 'txt'
    case 'sheet':
      return ['csv', 'tsv', 'xls', 'xlsx'].includes(ext)
    default:
      return true
  }
}

/** API returns `uploaded_at`; older paths may use `updated_at` / `created_at`. */
function documentUploadedAtIso(doc) {
  return doc.uploaded_at || doc.updated_at || doc.created_at || ''
}

function documentUploadTimestamp(doc) {
  const iso = documentUploadedAtIso(doc)
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

/** @typedef {{ id: string, filename?: string, source_type?: string, chatbot_id?: string | null, uploaded_at?: string, updated_at?: string, created_at?: string }} DocRow */

export default function LibrariesTab() {
  /** @type {[DocRow[], React.Dispatch<React.SetStateAction<DocRow[]>>]} */
  const [documents, setDocuments] = useState([])
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChatbotId, setFilterChatbotId] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [draftFilterChatbotId, setDraftFilterChatbotId] = useState('')
  const [draftFileTypeFilter, setDraftFileTypeFilter] = useState('')
  const [draftFromDate, setDraftFromDate] = useState('')
  const [draftToDate, setDraftToDate] = useState('')

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const filterDropdownRef = useRef(null)
  const filterTriggerRef = useRef(null)
  const filterPanelRef = useRef(null)
  const [filterPanelPosition, setFilterPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 312,
    placement: 'bottom',
  })

  const [sortKey, setSortKey] = useState({
    field: null,
    dir: null,
  })

  const [currentPage, setCurrentPage] = useState(1)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  /** @type {[DocRow | null, React.Dispatch<React.SetStateAction<DocRow | null>>]} */
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  /** 'pick' | 'upload' */
  const [addStep, setAddStep] = useState('pick')
  const [addChatbotId, setAddChatbotId] = useState('')
  const [inputMode, setInputMode] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [manualEditorOpen, setManualEditorOpen] = useState(false)
  const [manualChatbotId, setManualChatbotId] = useState('')

  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [limitMessage, setLimitMessage] = useState(
    'Document limit reached. Please upgrade your plan or purchase additional units.'
  )

  const { showToast, ToastContainer } = useToast()

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/documents/`)
      setDocuments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      showToast(formatApiErrorDetail(error, 'Failed to load documents'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchChatbots = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch chatbots:', error)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
    fetchChatbots()
  }, [fetchDocuments, fetchChatbots])

  const updateFilterPanelPosition = () => {
    if (!filterTriggerRef.current) return
    const rect = filterTriggerRef.current.getBoundingClientRect()
    const width = Math.min(312, window.innerWidth - 16)
    const panelHeight = filterPanelRef.current?.offsetHeight || 380
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

  useEffect(() => {
    const onPointerDown = (event) => {
      const clickedFilterTrigger = filterDropdownRef.current?.contains(event.target)
      const clickedFilterPanel = filterPanelRef.current?.contains(event.target)
      const clickedDateRangeUi = event.target.closest?.('[data-date-range-filter-ui]')
      if (!clickedFilterTrigger && !clickedFilterPanel && !clickedDateRangeUi) {
        setFilterModalOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFilterModalOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterChatbotId, fileTypeFilter, fromDate, toDate, searchQuery])

  const getChatbotName = useCallback(
    (chatbotId) => {
      if (!chatbotId) return '—'
      const c = chatbots.find((x) => x.id === chatbotId)
      return c?.name || '—'
    },
    [chatbots]
  )

  const chatbotOptions = useMemo(
    () => [
      { value: '', label: 'All Chatbots' },
      ...chatbots.map((c) => ({ value: c.id, label: c.name || 'Chatbot' })),
    ],
    [chatbots]
  )

  const addChatbotOptions = useMemo(
    () => [
      { value: '', label: 'Select chatbot' },
      ...chatbots.map((c) => ({ value: c.id, label: c.name || 'Chatbot' })),
    ],
    [chatbots]
  )

  const filteredDocuments = useMemo(() => {
    let list = documents
    if (filterChatbotId) {
      list = list.filter((d) => d.chatbot_id === filterChatbotId)
    }
    if (fileTypeFilter) {
      list = list.filter((d) => documentMatchesFileType(d, fileTypeFilter))
    }
    if (fromDate || toDate) {
      list = list.filter((d) => {
        const t = documentUploadTimestamp(d)
        if (t === null) return false
        if (fromDate) {
          const start = new Date(`${fromDate}T00:00:00`).getTime()
          if (t < start) return false
        }
        if (toDate) {
          const end = new Date(`${toDate}T23:59:59.999`).getTime()
          if (t > end) return false
        }
        return true
      })
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((d) => {
        const name = (d.filename || '').toLowerCase()
        const bot = getChatbotName(d.chatbot_id).toLowerCase()
        return name.includes(q) || bot.includes(q)
      })
    }
    return list
  }, [documents, filterChatbotId, fileTypeFilter, fromDate, toDate, searchQuery, getChatbotName])

  const sortedDocuments = useMemo(() => {
    const arr = [...filteredDocuments]
    const { field, dir } = sortKey
    if (!field || !dir) return arr
    const mult = dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (field === 'filename') {
        return mult * String(a.filename || '').localeCompare(String(b.filename || ''))
      }
      if (field === 'filetype') {
        const ta =
          a.source_type === 'url'
            ? 'url'
            : (a.filename?.split('.').pop() || '').toLowerCase()
        const tb =
          b.source_type === 'url'
            ? 'url'
            : (b.filename?.split('.').pop() || '').toLowerCase()
        return mult * ta.localeCompare(tb)
      }
      if (field === 'linked_chatbot') {
        return mult * getChatbotName(a.chatbot_id).localeCompare(getChatbotName(b.chatbot_id))
      }
      if (field === 'uploaded_at') {
        const ta = documentUploadTimestamp(a) ?? 0
        const tb = documentUploadTimestamp(b) ?? 0
        return mult * (ta - tb)
      }
      return 0
    })
    return arr
  }, [filteredDocuments, sortKey, getChatbotName])

  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const pagedDocuments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedDocuments.slice(start, start + PAGE_SIZE)
  }, [sortedDocuments, currentPage])

  const handleSortClick = (columnId) => {
    const map = {
      filename: 'filename',
      filetype: 'filetype',
      linked_chatbot: 'linked_chatbot',
      uploaded_at: 'uploaded_at',
    }
    const field = map[columnId]
    if (!field) return
    setSortKey((prev) => {
      const next = cycleTableSort(field, { column: prev.field, dir: prev.dir })
      return { field: next.column, dir: next.dir }
    })
  }

  const openAddModal = () => {
    setManualEditorOpen(false)
    setManualChatbotId('')
    setAddStep('pick')
    setAddChatbotId('')
    setInputMode('upload')
    setAddModalOpen(true)
  }

  const closeManualEditor = () => {
    setManualEditorOpen(false)
    setManualChatbotId('')
    setInputMode('upload')
    setAddStep('pick')
  }

  const closeAddModal = () => {
    if (uploading) return
    setAddModalOpen(false)
    setAddStep('pick')
    setAddChatbotId('')
    setDragOver(false)
    setInputMode('upload')
  }

  const goNextFromPick = () => {
    if (!addChatbotId.trim()) {
      showToast('Please select a chatbot', 'error')
      return
    }
    if (inputMode === 'manual') {
      setManualChatbotId(addChatbotId)
      setAddModalOpen(false)
      setManualEditorOpen(true)
      return
    }
    setAddStep('upload')
  }

  const uploadFilesToChatbot = async (files) => {
    if (!files.length || !addChatbotId) return
    setUploading(true)
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    try {
      await axios.post(`${API_URL}/api/documents/upload?chatbot_id=${addChatbotId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await fetchDocuments()
      const count = files.length
      showToast(
        `${count} document${count > 1 ? 's' : ''} uploaded and ${count > 1 ? 'are' : 'is'} being processed!`,
        'success'
      )
      closeAddModal()
      setSearchQuery('')
      setCurrentPage(1)
    } catch (error) {
      const code = error?.response?.data?.error_code || error?.response?.data?.detail?.error_code
      const msg = error?.response?.data?.message || error?.response?.data?.detail?.message
      if (code === 'DOCUMENT_LIMIT_REACHED') {
        setLimitMessage(msg || limitMessage)
        setLimitModalOpen(true)
      } else {
        showToast(formatApiErrorDetail(error, 'Failed to upload document(s)'), 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFilePick = async (e) => {
    const files = Array.from(e.target.files || [])
    await uploadFilesToChatbot(files)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    await uploadFilesToChatbot(files)
  }

  const deleteDocument = async () => {
    if (!documentToDelete?.id) return
    setDeletingId(documentToDelete.id)
    try {
      await axios.delete(`${API_URL}/api/documents/${documentToDelete.id}`)
      await fetchDocuments()
      showToast('Document deleted successfully', 'success')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to delete document'), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const fileTypeLabel = (row) => {
    if (row.source_type === 'url') return 'URL'
    const ext = row.filename?.split('.').pop()
    return ext ? ext.toUpperCase() : '—'
  }

  const columns = [
    {
      id: 'filename',
      label: 'File name',
      sortable: true,
      accessor: 'filename',
    },
    {
      id: 'filetype',
      label: 'File type',
      sortable: true,
      render: (row) => fileTypeLabel(row),
    },
    {
      id: 'linked_chatbot',
      label: 'Linked Chatbot',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-800">{getChatbotName(row.chatbot_id)}</span>
      ),
    },
    {
      id: 'uploaded_at',
      label: 'Uploaded at',
      sortable: true,
      render: (row) => formatDateDMY(documentUploadedAtIso(row)),
    },
    {
      id: 'actions',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setDocumentToDelete(row)
            setDeleteModalOpen(true)
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100"
          aria-label="Delete document"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      ),
    },
  ]

  const activeFilterCount =
    (filterChatbotId ? 1 : 0) +
    (fileTypeFilter ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0)

  return (
    <>
      <ToastContainer />

      <Modal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        title="Document limit"
      >
        <p className="text-sm text-gray-700">{limitMessage}</p>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={() => setLimitModalOpen(false)}>
            OK
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (deletingId) return
          setDeleteModalOpen(false)
          setDocumentToDelete(null)
        }}
        title="Delete Document"
        panelClassName="max-w-[min(92vw,400px)] rounded-xl border border-gray-200/80 shadow-2xl ring-1 ring-black/5"
      >
        <div className="-mt-1">
          <p className="text-sm leading-relaxed text-gray-900">
            Are you sure you want to delete{' '}
            <strong className="font-semibold text-gray-950">
              {documentToDelete?.filename || 'this document'}
            </strong>
            ?
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:text-sm">
            This action cannot be undone.
          </p>
          <div className="-mx-4 mt-6 flex justify-end gap-3 border-t border-gray-100 px-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setDocumentToDelete(null)
              }}
              disabled={deletingId}
              className="px-5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={deleteDocument}
              disabled={deletingId}
              className="border-red-600 bg-red-600 px-5 text-white hover:border-red-700 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500/35"
            >
              {deletingId ? <Spinner size="sm" className="text-white" /> : null}
              {deletingId ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        title="Add Knowledge"
        subtitle={addStep === 'pick' ? 'Choose how you want to provide knowledge.' : undefined}
        showCloseButton={!uploading}
        panelClassName="max-w-[640px] max-h-[min(92vh,620px)]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {addStep === 'pick' ? (
            <>
              <div>
                <SelectDropdown
                  label={
                    <>
                      Select Chatbots <span className="text-red-500">*</span>
                    </>
                  }
                  value={addChatbotId}
                  onChange={setAddChatbotId}
                  options={addChatbotOptions}
                  helperText="This document will be added to the selected chatbot’s knowledge base."
                  disabled={chatbots.length === 0}
                  variant="field"
                  className="w-full px-1 "
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  disabled={chatbots.length === 0}
                  title={chatbots.length === 0 ? 'Create a chatbot first' : undefined}
                  className={cn(
                    'flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-colors',
                    inputMode === 'manual'
                      ? 'border-brand-teal shadow-sm ring-1 ring-brand-teal/15'
                      : 'border-gray-200 hover:border-gray-300',
                    chatbots.length === 0 && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <img src="/svgs/knowledgebase/write-manually.svg" alt="Write manually" className="w-12 h-12" />
                  <span className="mt-3 text-sm font-semibold text-gray-900">Write manually</span>
                  <span className="mt-1 text-xs leading-relaxed text-gray-500">
                    Manually write your own specific knowledge.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode('upload')
                  }}
                  className={cn(
                    'flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-colors',
                    inputMode === 'upload'
                      ? 'border-brand-teal shadow-sm ring-1 ring-brand-teal/15'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <img src="/svgs/knowledgebase/upload.svg" alt="Upload" className="w-12 h-12" />
                  <span className="mt-3 text-sm font-semibold text-gray-900">Upload a Document</span>
                  <span className="mt-1 text-xs leading-relaxed text-gray-500">
                    Train your chatbot using your documents.
                  </span>
                </button>
              </div>

              <div className="mt-auto flex justify-between gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" className='w-full' onClick={closeAddModal} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={goNextFromPick}
                  disabled={uploading || !addChatbotId.trim()}
                  className='w-full'
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_UPLOAD}
                multiple
                onChange={handleFilePick}
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Select File</p>
                <button
                  type="button"
                  onDragEnter={() => setDragOver(true)}
                  onDragLeave={() => setDragOver(false)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    'mt-3 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
                    dragOver ? 'border-brand-teal bg-brand-teal/[0.04]' : 'border-gray-200 bg-gray-50/80 hover:border-gray-300',
                    uploading && 'pointer-events-none opacity-60'
                  )}
                >
                  <FileText className="h-10 w-10 text-brand-teal" strokeWidth={1.25} />
                  <span className="mt-4 text-sm font-semibold text-gray-900">
                    Click here to upload or drag your file here
                  </span>
                  <span className="mt-2 text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, TXT</span>
                </button>
              </div>

              <div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddStep('pick')}
                  disabled={uploading}
                >
                  Back
                </Button>
                <Button type="button" variant="outline" onClick={closeAddModal} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Spinner size="sm" className="text-white" /> : null}
                  {uploading ? 'Uploading…' : 'Upload Knowledge'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {manualEditorOpen && manualChatbotId ? (
        <ManualKnowledgeEntryView
          chatbotId={manualChatbotId}
          chatbotName={getChatbotName(manualChatbotId)}
          showToast={showToast}
          onClose={closeManualEditor}
          onSaved={async () => {
            await fetchDocuments()
            showToast('Manual knowledge saved and is being processed.', 'success')
            setSearchQuery('')
            setCurrentPage(1)
          }}
          onLimitReached={(msg) => {
            setLimitMessage(msg || limitMessage)
            setLimitModalOpen(true)
          }}
          limitMessage={limitMessage}
        />
      ) : (
      <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-6 gap-6">
        {/* Page header */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200/80 pb-5 sm:flex-row items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Knowledge Base</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-500">
              Centralize files and written content used by your chatbot to answer user questions.
            </p>
          </div>
          <Button type="button" variant="primary" className="shrink-0 gap-2 py-3 shadow-sm !rounded-xl" onClick={openAddModal}>
            Add Knowledge
          </Button>
        </div>

        {/* Tabs — Manual Responses reserved for a later flow */}
        {/* <div className="mb-4 flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-lg bg-gray-200/90 px-4 py-2 text-sm font-semibold text-gray-900"
          >
            Documents
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold text-gray-400"
          >
            Manual Responses
          </button>
        </div> */}

        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl ${documents.length === 0 ? " ": "bg-white "}`}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon="guardrails"
              title="No Knowledge Base yet!"
              description="Add Knowledge base by uploading a document or by writing manually."
            >
              <div className="mt-6">
                <Button type="button" variant="primary" onClick={openAddModal}>
                  Add Knowledge
                </Button>
              </div>
            </EmptyState>
          ) : (
            <>
              <div className="shrink-0 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-lg font-bold text-gray-900">All Documents</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                      placeholder="Search here..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full sm:w-[220px]"
                    />
                    <div ref={filterDropdownRef} className="relative">
                      <button
                        ref={filterTriggerRef}
                        type="button"
                        onClick={() => {
                          setDraftFilterChatbotId(filterChatbotId)
                          setDraftFileTypeFilter(fileTypeFilter)
                          setDraftFromDate(fromDate)
                          setDraftToDate(toDate)
                          setFilterModalOpen((prev) => !prev)
                        }}
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                          activeFilterCount
                            ? 'border-brand-teal/40 bg-brand-teal/[0.06] text-brand-teal'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2} />
                        Filters
                        {activeFilterCount > 0 ? (
                          <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-teal px-1 text-[10px] font-bold leading-none text-white">
                            {activeFilterCount}
                          </span>
                        ) : null}
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform',
                            filterModalOpen ? 'rotate-180' : ''
                          )}
                        />
                      </button>

                      {filterModalOpen &&
                        createPortal(
                          <div
                            ref={filterPanelRef}
                            className="fixed z-40 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                            style={{
                              top: `${filterPanelPosition.top}px`,
                              left: `${filterPanelPosition.left}px`,
                              width: `${filterPanelPosition.width}px`,
                            }}
                          >
                            <h3
                              className="mb-2.5 text-base font-bold leading-relaxed"
                              style={{ color: COLORS.BRAND }}
                            >
                              Filter Options
                            </h3>
                            <div className="space-y-2.5">
                              <SelectDropdown
                                label="Linked Chatbots"
                                value={draftFilterChatbotId}
                                onChange={setDraftFilterChatbotId}
                                options={chatbotOptions}
                                variant="field"
                                className="!space-y-1.5 [&>label]:text-sm [&>label]:font-semibold [&>label]:text-gray-900 [&_div.relative>button]:min-h-9 [&_div.relative>button]:py-2 [&_div.relative>button]:text-xs [&_div.relative>button]:font-medium py-2 "
                              />
                              <SelectDropdown
                                label="File type"
                                value={draftFileTypeFilter}
                                onChange={setDraftFileTypeFilter}
                                options={FILE_TYPE_FILTER_OPTIONS}
                                variant="field"
                                className="!space-y-1.5 [&>label]:text-sm [&>label]:font-semibold [&>label]:text-gray-900 [&_div.relative>button]:min-h-9 [&_div.relative>button]:py-2 [&_div.relative>button]:text-sm [&_div.relative>button]:font-medium pb-2"
                              />
                              <DateRangeFilterField
                                dateFrom={draftFromDate}
                                dateTo={draftToDate}
                                onChange={(from, to) => {
                                  setDraftFromDate(from)
                                  setDraftToDate(to)
                                }}
                                label="Date Range"
                                placeholder="Select date range"
                                className="[&_div.flex>button]:h-9 [&_div.flex>button]:min-h-9 [&_div.flex>button]:text-sm [&_label]:mb-1 [&_label]:text-sm [&_label]:font-semibold [&_label]:text-gray-900 pb-2"
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setDraftFilterChatbotId('')
                                  setDraftFileTypeFilter('')
                                  setDraftFromDate('')
                                  setDraftToDate('')
                                  setFilterChatbotId('')
                                  setFileTypeFilter('')
                                  setFromDate('')
                                  setToDate('')
                                  setFilterModalOpen(false)
                                  setCurrentPage(1)
                                }}
                                className="w-full justify-center px-3 py-2.5 text-xs hover:bg-brand-teal/5"
                              >
                                Clear Filters
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                  setFilterChatbotId(draftFilterChatbotId)
                                  setFileTypeFilter(draftFileTypeFilter)
                                  setFromDate(draftFromDate)
                                  setToDate(draftToDate)
                                  setFilterModalOpen(false)
                                  setCurrentPage(1)
                                }}
                                className="w-full justify-center px-3 py-2.5 text-xs"
                              >
                                Apply Filters
                              </Button>
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-4 sm:px-4">
                {sortedDocuments.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-500">
                    No documents match your search or filters.
                  </div>
                ) : (
                  <>
                    <Table
                      columns={columns}
                      data={pagedDocuments}
                      keyExtractor={(row) => row.id}
                      minWidth="860px"
                      onSortClick={handleSortClick}
                      sortColumnId={sortKey.field}
                      sortDirection={sortKey.dir}
                      className="!pt-0 sm:!pt-0"
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="shrink-0 border-t border-gray-100"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </>
  )
}
