import { useEffect, useMemo, useState } from 'react'
import { Bot, Check } from 'lucide-react'
import Modal from '../Modal'
import { SearchInput } from './SearchInput'
import { Button } from './Button'
import { SelectDropdown } from './SelectDropdown'
import { COLORS } from '../../lib/designTokens'
import { formatDateDMY } from '../../utils/formatDateDMY'
import { cn } from '../../utils/cn'

const CHATBOT_SORT_OPTIONS = [
  { value: 'name_desc', label: 'Sort by' },
  { value: 'newest', label: 'Sort by · Newest' },
  { value: 'oldest', label: 'Sort by · Oldest' },
]

/**
 * @typedef {object} ChatbotOption
 * @property {string} id
 * @property {string} name
 * @property {string} [created_at]
 */

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {ChatbotOption[]} props.chatbots
 * @param {string | null} [props.selectedChatbotId]
 * @param {(chatbot: ChatbotOption) => void} props.onConfirm
 * @param {boolean} [props.loading]
 * @param {string} [props.searchPlaceholder]
 * @param {string} [props.confirmLabel]
 * @param {string} [props.title]
 */
export function SelectChatbotModal({
  isOpen,
  onClose,
  chatbots,
  selectedChatbotId = null,
  onConfirm,
  loading = false,
  searchPlaceholder = 'Search chatbots...',
  confirmLabel = 'Open Chatbot',
  title = 'Select a Chatbot',
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [pendingId, setPendingId] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      return
    }
    if (selectedChatbotId != null && chatbots.some((c) => String(c.id) === String(selectedChatbotId))) {
      setPendingId(selectedChatbotId)
    } else if (chatbots.length > 0) {
      setPendingId(chatbots[0].id)
    } else {
      setPendingId(null)
    }
  }, [isOpen, selectedChatbotId, chatbots])

  const filteredSorted = useMemo(() => {
    let list = [...chatbots]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((c) => c.name?.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      switch (sortBy) {
        case 'name_desc':
          return nameB.localeCompare(nameA)
        case 'newest':
          return timeB - timeA
        case 'oldest':
          return timeA - timeB
        case 'name_asc':
        default:
          return nameA.localeCompare(nameB)
      }
    })
    return list
  }, [chatbots, query, sortBy])

  const handleConfirm = () => {
    const bot = chatbots.find((c) => String(c.id) === String(pendingId))
    if (bot) {
      onConfirm(bot)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      panelClassName="max-w-xl"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-none min-w-0 flex-1"
          />
          <SelectDropdown
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            options={CHATBOT_SORT_OPTIONS}
            className="w-full shrink-0 sm:w-[min(120px,100%)] [&_label]:text-xs [&_button]:min-h-10 [&_button]:border-0 [&_button]:bg-gray-100 [&_button]:py-2 [&_button]:text-sm"
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden pr-1">
          {loading && chatbots.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-sm text-gray-500">Loading chatbots…</p>
          ) : filteredSorted.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-sm text-gray-500">No chatbots match your search.</p>
          ) : (
            filteredSorted.map((bot) => {
              const selected = String(pendingId) === String(bot.id)
              return (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => setPendingId(bot.id)}
                  className={cn(
                    'relative flex gap-3 rounded-xl border p-3 text-left transition-colors',
                    selected ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                  style={
                    selected
                      ? {
                          borderColor: COLORS.BRAND,
                          backgroundColor: COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG,
                        }
                      : undefined
                  }
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                    <img src="/svgs/playground/chatbott.svg" alt="Chatbot" className="h-10 w-10 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-bold text-gray-900">{bot.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDateDMY(bot.created_at)}</p>
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" className=" flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            disabled={pendingId == null || loading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
