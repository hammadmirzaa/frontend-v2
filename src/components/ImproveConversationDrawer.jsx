import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { useToast } from '../hooks/useToast'

/**
 * Right-side drawer for conversation quality feedback (design-aligned; no backend API yet).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(feedback: string) => void} [props.onSubmit]
 */
export default function ImproveConversationDrawer({ open, onClose, onSubmit }) {
  const [feedback, setFeedback] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (!open) setFeedback('')
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = () => {
    const text = feedback.trim()
    if (!text) {
      showToast('Please enter feedback before submitting.', 'error')
      return
    }
    if (onSubmit) {
      onSubmit(text)
    } else {
      showToast('Thank you — your feedback has been noted.', 'success')
    }
    setFeedback('')
    onClose()
  }

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close feedback"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[121] flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="improve-conversation-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4">
          <div>
            <h2 id="improve-conversation-title" className="text-sm font-bold text-gray-900">
              Improve Conversation Quality
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Your feedback will be reviewed to improve future conversations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-lg border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-[11px] leading-relaxed text-gray-700">
            Was the response inaccurate, incomplete, off-tone, or missing a next step? Mention where the chatbot struggled and
            what it should have done instead.
          </div>

          <label htmlFor="conversation-feedback" className="mt-4 block text-xs font-semibold text-gray-900">
            Your Feedback
          </label>
          <textarea
            id="conversation-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={7}
            placeholder="Example: The chatbot should have asked about budget before suggesting pricing plans. The tone was too casual for a B2B conversation."
            className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 placeholder:text-[11px] placeholder:text-gray-400 focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          />
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            This feedback will be saved and used to improve future responses for similar conversations.
          </p>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <Button type="button" variant="outline" className="flex-1 py-2 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" className="flex-1 py-2 text-xs" onClick={handleSubmit}>
            Submit Review
          </Button>
        </div>
      </aside>
    </>,
    document.body
  )
}
