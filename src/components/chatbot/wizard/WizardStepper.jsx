import { Fragment } from 'react'
import { Check } from 'lucide-react'

/** Horizontal gap between circle and connector (matches previous stepper rhythm). */
const LINE_ICON_GAP = 'mx-2 sm:mx-3'

/**
 * Horizontal stepper: connectors sit on the same row as the circles only, so lines sit
 * between icons at their vertical center (not between icon and label).
 */
export default function WizardStepper({ steps, currentIndex }) {
  return (
    <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible">
      <div className="mx-auto w-full min-w-0">
        {/* Row 1: circles + segments only — flex items-center aligns line with icon midline */}
        <div className="flex w-full items-center gap-8">
          {steps.map((step, i) => {
            const Icon = step.Icon
            const done = i < currentIndex
            const active = i === currentIndex
            const filled = done || active
            const ariaLabel = step.labelLines.join(' ')
            const segmentAfterTeal = i < currentIndex

            return (
              <Fragment key={step.id}>
                <div className="flex shrink-0 justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 md:h-11 md:w-11 ${
                      filled ? 'bg-brand-teal text-white' : 'border-2 border-gray-200 bg-white text-gray-400'
                    }`}
                    aria-current={active ? 'step' : undefined}
                    aria-label={ariaLabel}
                  >
                    {done ? (
                      <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" strokeWidth={2.75} aria-hidden />
                    ) : (
                      <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 md:h-[22px] md:w-[22px]" strokeWidth={2} aria-hidden />
                    )}
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 min-w-[8px] flex-1 self-center ${LINE_ICON_GAP} ${segmentAfterTeal ? 'bg-brand-teal' : 'bg-gray-200'}`}
                    aria-hidden
                  />
                )}
              </Fragment>
            )
          })}
        </div>

        {/* Row 2: labels — same column pattern as row 1 so text stays under each circle */}
        <div className="mt-2.5 flex w-full items-start sm:mt-3">
          {steps.map((step, i) => {
            const filled = i <= currentIndex

            return (
              <Fragment key={`${step.id}-labels`}>
                <div className="flex shrink-0 justify-center">
                  <div
                    className={`flex w-9 flex-col items-center justify-start text-center sm:w-10 md:w-11 ${
                      filled ? 'text-brand-teal' : 'text-gray-400'
                    }`}
                  >
                    {step.labelLines.map((line, li) => (
                      <span
                        key={`${step.id}-${li}`}
                        className="block max-w-[5.25rem] text-[11px] font-bold leading-[1.2] tracking-tight sm:max-w-[6.5rem] sm:text-[12px] md:max-w-[7.5rem] md:text-[13px] lg:max-w-[8rem] lg:text-sm"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div className={`min-h-0 min-w-[8px] flex-1 ${LINE_ICON_GAP}`} aria-hidden />
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
