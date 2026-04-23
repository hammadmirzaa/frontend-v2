import { X } from 'lucide-react'
import { Button } from './ui'

/** Decorative Google Calendar–style mark (not an official logo asset). */
function GoogleCalendarIllustration() {
  return (
    <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center">
      <div
        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-lg shadow-md"
        style={{ backgroundColor: '#1a73e8' }}
      >
        <span className="select-none text-4xl font-normal leading-none text-white">31</span>
        <span className="pointer-events-none absolute right-0 top-0 h-0 w-0 border-l-[14px] border-t-[14px] border-l-transparent border-t-[#fbc02d]" aria-hidden />
        <span className="pointer-events-none absolute bottom-1 left-1 right-1 flex justify-center gap-1" aria-hidden>
          <span className="h-1.5 w-4 rounded-sm bg-[#34a853]" />
          <span className="h-1.5 w-4 rounded-sm bg-[#ea4335]" />
          <span className="h-1.5 w-4 rounded-sm bg-[#fbbc04]" />
        </span>
      </div>
    </div>
  )
}

/**
 * First-step prompt when opening follow-up from Leads — connect Google Calendar or continue to the form.
 *
 * @param {object} props
 * @param {() => void} props.onContinueToFollowUp — “Not Now”, header close, backdrop (show real follow-up modal)
 */
export default function GoogleCalendarIntroModal({ onContinueToFollowUp }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onContinueToFollowUp}
      />
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gcal-intro-title"
      >
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 id="gcal-intro-title" className="text-lg font-bold text-gray-900 sm:text-xl">
                Add Google Calendar
              </h2>
              <p className="text-sm text-gray-500">
                Add this scheduled event to your Google Calendar so you never miss it.
              </p>
            </div>
            <button
              type="button"
              onClick={onContinueToFollowUp}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Stay on track with Google Calendar</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Add this event to your Google Calendar to get reminders and keep everything in one place. You can skip this
              step if you prefer.
            </p>
          </div>

          <GoogleCalendarIllustration />

          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>We&apos;ll create a calendar reminder for this event and keep it updated if anything changes.</p>
            <p>We only access your calendar to create and update scheduled events.</p>
            <p>
              You can connect Google Calendar later from{' '}
              <span className="font-semibold text-gray-900">Settings → Integrations</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onContinueToFollowUp}>
            Not Now
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => {
              /* Reserved for Google Calendar OAuth — static for now */
            }}
          >
            Connect Google Calendar
          </Button>
        </div>
      </div>
    </div>
  )
}
