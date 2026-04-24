import { useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import { ArrowLeft, FileText, Clock, Globe } from 'lucide-react'
import config from '../config'
import { Button, SelectDropdown } from './ui'
import Spinner from './Spinner'
import { formatApiErrorDetail } from '../utils/formatApiError'
import { cn } from '../utils/cn'

const API_URL = config.API_URL

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'el-GR', label: 'Greek' },
  { value: 'de-DE', label: 'German' },
  { value: 'fr-FR', label: 'French' },
]

/**
 * Full-width manual knowledge entry (title + body) with details sidebar.
 * Persists via POST /api/documents/ingest-text.
 */
export default function ManualKnowledgeEntryView({
  chatbotId,
  chatbotName,
  onClose,
  onSaved,
  onLimitReached,
  showToast,
  limitMessage = 'Document limit reached. Please upgrade your plan or purchase additional units.',
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('en-US')
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => title.trim() !== '' || content.trim() !== '', [title, content])

  const handleBack = useCallback(() => {
    if (dirty && !window.confirm('Discard this entry? Your changes will be lost.')) return
    onClose()
  }, [dirty, onClose])

  const handleSaveAndClose = async () => {
    const body = content.trim()
    if (!body) {
      showToast?.('Please enter some content before saving.', 'error')
      return
    }
    const payload = {
      title: title.trim() || 'Untitled',
      content: body,
      chatbot_id: chatbotId,
    }
    setSaving(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/documents/ingest-text`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      onSaved?.(data)
      onClose()
    } catch (error) {
      const code = error?.response?.data?.error_code || error?.response?.data?.detail?.error_code
      const msg = error?.response?.data?.message || error?.response?.data?.detail?.message
      if (code === 'DOCUMENT_LIMIT_REACHED') {
        onLimitReached?.(msg || limitMessage)
        onClose()
      } else {
        showToast?.(formatApiErrorDetail(error, 'Could not save knowledge entry'), 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col overflow-hidden bg-[#F4F5F7]">
      {/* <div className="flex shrink-0 items-center gap-3 border-b border-gray-200/80 bg-white px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          aria-label="Back to knowledge list"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">Manual entry</h1>
          <p className="truncate text-xs text-gray-500 sm:text-sm">Linked to {chatbotName || 'chatbot'}</p>
        </div>
      </div> */}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:gap-0 lg:p-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              disabled={saving}
              className="w-full border-0 bg-transparent p-0 text-2xl font-semibold tracking-tight text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0 sm:text-3xl"
              autoComplete="off"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your knowledge here…"
              disabled={saving}
              className={cn(
                'mt-6 min-h-[min(420px,calc(100vh-22rem))] w-full resize-y rounded-lg border border-gray-100 bg-gray-50/40 p-4 text-sm leading-relaxed text-gray-900',
                'placeholder:text-gray-400 focus:border-brand-teal/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20'
              )}
            />
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:ml-6 lg:w-[min(100%,320px)] lg:self-stretch">
          <h2 className="text-base font-bold text-gray-900">Details</h2>

          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Data source</p>
              <div className="mt-2 flex items-center gap-2 text-gray-800">
                <FileText className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                <span className="font-medium">Manual</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last updated</p>
              <div className="mt-2 flex items-center gap-2 text-gray-800">
                <Clock className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                <span>Not saved yet</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Linked chatbots</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {chatbotName || 'Chatbot'}
                </span>
              </div>
            </div>

            <div>
              <SelectDropdown
                label="Language"
                leading={<Globe className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} aria-hidden />}
                value={language}
                onChange={setLanguage}
                options={LANGUAGE_OPTIONS}
                variant="field"
                className="w-full"
                helperText="Display only — not sent to the API."
              />
            </div>
          </div>

          <div className="mt-auto border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="primary"
              className="inline-flex w-full items-center justify-center gap-2 py-3 !rounded-xl font-semibold"
              onClick={handleSaveAndClose}
              disabled={saving || !content.trim()}
            >
              {saving ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Saving…
                </>
              ) : (
                'Save and Close'
              )}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
