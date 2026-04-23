import { X } from 'lucide-react'

export default function WizardHeader({ onClose, busy }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-[#F9FAFB] pb-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-2xl">Create a New Chatbot</h1>
        <p className="mt-1 text-xs text-gray-500">Tailor your assistant&apos;s look, tone, and voice to fit your brand.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200/80 hover:text-gray-700 disabled:opacity-50"
        aria-label="Close"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  )
}
