import { ChevronLeft, ChevronRight } from 'lucide-react'
import Spinner from '../../Spinner'

export default function WizardFooter({
  step,
  busy,
  showSkip,
  onCancel,
  onBack,
  onSkip,
  onNext,
  onActivate,
  canActivate,
}) {
  return (
    <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={step === 0 ? onCancel : onBack}
        disabled={busy}
        className={`inline-flex items-center gap-1 text-sm font-medium ${
          step === 0 ? 'text-gray-400' : 'text-brand-teal hover:text-brand-teal-hover'
        } disabled:opacity-50`}
      >
        <ChevronLeft className="h-4 w-4" />
        {step === 0 ? 'Cancel' : 'Back'}
      </button>

      <div className="flex flex-wrap items-center gap-3">
        {showSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={busy}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
          >
            {busy ? <Spinner size="sm" className="text-white" /> : null}
            <span>Next step</span>
            {!busy && <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onActivate}
            disabled={busy || !canActivate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
          >
            Activate chatbot
          </button>
        )}
      </div>
    </div>
  )
}
