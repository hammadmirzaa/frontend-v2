import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Trash2, Pencil, MessageSquare, RotateCcw, Bot } from 'lucide-react'
import CreateChatbotWizard from './chatbot/wizard/CreateChatbotWizard'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import Modal from './Modal'
import Spinner from './Spinner'
import ChatbotDetailView from './ChatbotDetailView'
import EmptyState from './EmptyState'
import { formatApiErrorDetail } from '../utils/formatApiError'
import { useDashboardSearch } from '../contexts/DashboardSearchContext'
import { SearchInput, Table, Pagination, Button } from './ui'
import { formatDateDMY } from '../utils/formatDateDMY'
import { cycleTableSort } from '../utils/tableSort'

const API_URL = config.API_URL
const PAGE_SIZE = 20

export default function ChatbotsTab({
  onSelectChatbot = null,
  canManageDeletedChatbots = false,
}) {
  const [subTab, setSubTab] = useState('active')
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletedChatbots, setDeletedChatbots] = useState([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)
  const [createWizardOpen, setCreateWizardOpen] = useState(false)
  const [wizardMountKey, setWizardMountKey] = useState(0)
  const [selectedChatbotId, setSelectedChatbotId] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [chatbotToDelete, setChatbotToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [restoringId, setRestoringId] = useState(null)
  const [page, setPage] = useState(1)
  const [tableSort, setTableSort] = useState({ column: null, dir: null })
  const { showToast, ToastContainer } = useToast()
  const { query: searchQuery, setQuery } = useDashboardSearch()

  const filteredChatbots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return chatbots
    return chatbots.filter((c) => (c.name || '').toLowerCase().includes(q))
  }, [chatbots, searchQuery])

  const filteredDeletedChatbots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return deletedChatbots
    return deletedChatbots.filter((c) => (c.name || '').toLowerCase().includes(q))
  }, [deletedChatbots, searchQuery])

  const sortedChatbots = useMemo(() => {
    const list = [...filteredChatbots]
    const { column: sortKey, dir: sortDir } = tableSort
    if (!sortKey || !sortDir) return list
    const mul = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (sortKey === 'name') {
        return mul * (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      }
      if (sortKey === 'created_at') {
        return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      return 0
    })
    return list
  }, [filteredChatbots, tableSort])

  const totalPagesActive = Math.max(1, Math.ceil(sortedChatbots.length / PAGE_SIZE))

  const paginatedChatbots = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sortedChatbots.slice(start, start + PAGE_SIZE)
  }, [sortedChatbots, page])

  const totalPagesDeleted = Math.max(1, Math.ceil(filteredDeletedChatbots.length / PAGE_SIZE))

  const paginatedDeletedChatbots = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredDeletedChatbots.slice(start, start + PAGE_SIZE)
  }, [filteredDeletedChatbots, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, subTab])

  useEffect(() => {
    const max =
      subTab === 'deleted' && canManageDeletedChatbots ? totalPagesDeleted : totalPagesActive
    setPage((p) => Math.min(p, max))
  }, [subTab, canManageDeletedChatbots, totalPagesActive, totalPagesDeleted])

  useEffect(() => {
    fetchChatbots()
  }, [])

  useEffect(() => {
    if (canManageDeletedChatbots && subTab === 'deleted') {
      fetchDeletedChatbots()
    }
  }, [subTab, canManageDeletedChatbots])

  const fetchChatbots = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(response.data)
    } catch (error) {
      console.error('Failed to fetch chatbots:', error)
      showToast('Failed to load chatbots', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeletedChatbots = async () => {
    setLoadingDeleted(true)
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/deleted`)
      setDeletedChatbots(response.data)
    } catch (error) {
      console.error('Failed to fetch deleted chatbots:', error)
      showToast(formatApiErrorDetail(error, 'Failed to load deleted chatbots'), 'error')
    } finally {
      setLoadingDeleted(false)
    }
  }

  const handleCreateClick = () => {
    setWizardMountKey((k) => k + 1)
    setCreateWizardOpen(true)
  }

  const handleDeleteClick = (chatbot) => {
    setChatbotToDelete(chatbot)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!chatbotToDelete) return

    setDeleting(true)
    try {
      const res = await axios.delete(`${API_URL}/api/chatbots/${chatbotToDelete.id}`)
      await fetchChatbots()
      if (canManageDeletedChatbots) {
        fetchDeletedChatbots()
      }
      showToast(
        typeof res.data?.message === 'string' ? res.data.message : 'Chatbot removed',
        'success'
      )
      setDeleteModalOpen(false)
      setChatbotToDelete(null)
      if (selectedChatbotId === chatbotToDelete.id) {
        setSelectedChatbotId(null)
      }
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to delete chatbot'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleChatbotClick = (chatbotId) => {
    setSelectedChatbotId(chatbotId)
  }

  const handleBackToList = () => {
    setSelectedChatbotId(null)
    fetchChatbots()
    if (canManageDeletedChatbots) {
      fetchDeletedChatbots()
    }
  }

  const handleRestore = async (chatbot) => {
    setRestoringId(chatbot.id)
    try {
      await axios.post(`${API_URL}/api/chatbots/${chatbot.id}/restore`)
      await fetchChatbots()
      await fetchDeletedChatbots()
      showToast(`“${chatbot.name}” restored`, 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to restore chatbot'), 'error')
    } finally {
      setRestoringId(null)
    }
  }

  const handleSortClick = useCallback((columnId) => {
    if (columnId !== 'name' && columnId !== 'created_at') return
    setTableSort((prev) => cycleTableSort(columnId, prev))
  }, [])

  const activeTableColumns = useMemo(
    () => [
      { id: 'name', label: 'Chatbot name', sortable: true, accessor: 'name' },
      {
        id: 'status',
        label: 'Status',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (row) => (
          <span
            className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
            style={
              row.is_active
                ? { backgroundColor: '#e8f9ee', color: '#28a745' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
            }
          >
            {row.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        id: 'created_at',
        label: 'Created at',
        sortable: true,
        render: (row) => formatDateDMY(row.created_at),
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
              onClick={() => handleChatbotClick(row.id)}
              className="rounded-md p-1.5 text-gray-800 transition-colors hover:bg-gray-100"
              aria-label="Edit chatbot"
            >
              <Pencil size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
              aria-label="Delete chatbot"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ],
    [handleChatbotClick, handleDeleteClick]
  )

  const deletedTableColumns = useMemo(
    () => [
      { id: 'name', label: 'Chatbot name', accessor: 'name' },
      {
        id: 'deleted_at',
        label: 'Deleted at',
        render: (row) => (row.deleted_at ? new Date(row.deleted_at).toLocaleString() : '—'),
      },
      {
        id: 'actions',
        label: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (row) => (
          <button
            type="button"
            onClick={() => handleRestore(row)}
            disabled={restoringId === row.id}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
          >
            {restoringId === row.id ? <Spinner size="sm" className="text-white" /> : <RotateCcw size={14} />}
            Restore
          </button>
        ),
      },
    ],
    [restoringId, handleRestore]
  )

  // If a chatbot is selected, show detail view
  if (selectedChatbotId) {
    return (
      <ChatbotDetailView
        chatbotId={selectedChatbotId}
        onBack={handleBackToList}
        onChatbotUpdated={fetchChatbots}
      />
    )
  }

  if (createWizardOpen) {
    return (
      <>
        <ToastContainer />
        <div className="flex min-h-[min(640px,calc(100vh-5rem))] flex-col rounded-xl ">
          <CreateChatbotWizard
            key={wizardMountKey}
            showToast={showToast}
            onCancel={() => setCreateWizardOpen(false)}
            onComplete={async () => {
              setCreateWizardOpen(false)
              await fetchChatbots()
              showToast('Chatbot added to your list', 'success')
            }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer />
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setChatbotToDelete(null)
        }}
        title="Delete chatbot"
        panelClassName="max-w-md rounded-xl shadow-2xl"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="text-sm leading-relaxed text-gray-700">
            Are you sure you want to delete{' '}
            <strong className="font-semibold text-gray-900">{chatbotToDelete?.name ?? 'this chatbot'}</strong>?
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false)
                setChatbotToDelete(null)
              }}
              disabled={deleting}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="min-w-[5.5rem]"
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex h-full min-h-0 flex-col p-6 gap-6 ">
        <div className="border-b border-gray-200 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chatbot Management</h2>
              <p className="mt-1 text-sm text-gray-500">
                Generate embed code to integrate your chatbot into any website
              </p>
              {canManageDeletedChatbots && (
                <div className="mt-4 space-y-2">
                  <div className="flex border-b border-gray-200 -mb-px">
                    <button
                      type="button"
                      onClick={() => setSubTab('active')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        subTab === 'active'
                          ? 'border-brand-teal text-brand-teal'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Active chatbots
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('deleted')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        subTab === 'deleted'
                          ? 'border-brand-teal text-brand-teal'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Deleted chatbots
                    </button>
                  </div>
                </div>
              )}
            </div>
            {subTab === 'active' && (
              <Button type="button" variant="primary" className="shrink-0 gap-2 py-3 shadow-sm !rounded-xl" onClick={handleCreateClick}>
                Create a new chatbot
              </Button>
            )}
          </div>
        </div>

        <div
          className={`flex min-h-0 ${chatbots.length === 0 ? 'h-full' : ''} flex-col p-4 rounded-xl ${
            subTab === 'deleted' && canManageDeletedChatbots
              ? !loadingDeleted && deletedChatbots.length > 0
                ? 'bg-white'
                : ''
              : !loading && chatbots.length > 0
                ? 'bg-white'
                : ''
          }`}
        >
          {subTab === 'deleted' && canManageDeletedChatbots ? (
            loadingDeleted ? (
              <div className="py-12 text-center text-gray-500">
                <Spinner size="lg" />
                <p className="mt-4">Loading deleted chatbots...</p>
              </div>
            ) : deletedChatbots.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No deleted chatbots"
                description="When someone removes a chatbot, it appears here so you can restore it."
                spacious={false}
              />
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Deleted chatbots</h3>
                    <p className="text-sm text-gray-500">Restore a chatbot to the active list.</p>
                  </div>
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full sm:max-w-md sm:shrink-0"
                  />
                </div>
                {filteredDeletedChatbots.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">No deleted chatbots match your search.</div>
                ) : (
                  <div className="flex min-h-0 flex-col overflow-hidden">
                    <Table
                      columns={deletedTableColumns}
                      data={paginatedDeletedChatbots}
                      keyExtractor={(row) => row.id}
                      minWidth="520px"
                    />
                    <Pagination
                      currentPage={page}
                      totalPages={totalPagesDeleted}
                      onPageChange={setPage}
                      className="shrink-0"
                    />
                  </div>
                )}
              </>
            )
          ) : loading ? (
            <div className="py-12 text-center text-gray-500">
              <Spinner size="lg" />
              <p className="mt-4">Loading chatbots...</p>
            </div>
          ) : chatbots.length === 0 ? (
            <EmptyState
              icon="bot2"
              title="Your chatbot list is empty"
              description="Once you add a chatbot, it will appear here."
            />
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Chatbots</h3>
                  <p className="text-sm text-gray-500">Manage and explore all your chatbots in one place.</p>
                </div>
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full sm:max-w-[400px] sm:shrink-0"
                />
              </div>
              {filteredChatbots.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">No chatbots match your search.</div>
              ) : (
                <div className="flex min-h-0 flex-col overflow-hidden">
                  <Table
                    columns={activeTableColumns}
                    data={paginatedChatbots}
                    keyExtractor={(row) => row.id}
                    minWidth="640px"
                    onSortClick={handleSortClick}
                    sortColumnId={tableSort.column}
                    sortDirection={tableSort.dir}
                  />
                  <Pagination
                    currentPage={page}
                    totalPages={totalPagesActive}
                    onPageChange={setPage}
                    className="shrink-0"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

