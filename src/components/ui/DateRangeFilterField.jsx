import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toYMD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function fromYMD(s) {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(dt.getTime()) ? null : dt
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function dayMidnight(d) {
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function formatDateUSShort(ymd) {
  const d = fromYMD(ymd)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRangeButtonLabel(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return ''
  if (dateFrom && dateTo) return `${formatDateUSShort(dateFrom)} - ${formatDateUSShort(dateTo)}`
  if (dateFrom) return `${formatDateUSShort(dateFrom)} - …`
  return formatDateUSShort(dateTo)
}

/** Dual-month range picker — brand teal. */
function RangeCalendarPanel({ dateFrom, dateTo, onApply, onClose }) {
  const anchor = fromYMD(dateFrom) || fromYMD(dateTo) || new Date()
  const [leftMonth, setLeftMonth] = useState(() => new Date(anchor.getFullYear(), anchor.getMonth(), 1))
  const [draftStart, setDraftStart] = useState(() => fromYMD(dateFrom))
  const [draftEnd, setDraftEnd] = useState(() => fromYMD(dateTo))

  useEffect(() => {
    setDraftStart(fromYMD(dateFrom))
    setDraftEnd(fromYMD(dateTo))
    const a = fromYMD(dateFrom) || fromYMD(dateTo)
    if (a) setLeftMonth(new Date(a.getFullYear(), a.getMonth(), 1))
  }, [dateFrom, dateTo])

  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1)

  const handleDayClick = (year, month, day) => {
    const clicked = new Date(year, month, day)
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(clicked)
      setDraftEnd(null)
      return
    }
    let s = draftStart
    let e = clicked
    if (clicked.getTime() < draftStart.getTime()) {
      s = clicked
      e = draftStart
    } else {
      s = draftStart
      e = clicked
    }
    setDraftStart(s)
    setDraftEnd(e)
  }

  const handleApplyClick = () => {
    if (!draftStart) {
      onClose()
      return
    }
    const from = toYMD(draftStart)
    const to = draftEnd ? toYMD(draftEnd) : from
    onApply(from, to)
    onClose()
  }

  const handleClearClick = () => {
    setDraftStart(null)
    setDraftEnd(null)
    onApply('', '')
    onClose()
  }

  const renderMonth = (monthDate) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const pad = first.getDay()
    const cells = []
    for (let i = 0; i < pad; i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) cells.push(d)

    const startMs = draftStart ? dayMidnight(draftStart) : null
    const endMs = draftEnd ? dayMidnight(draftEnd) : null

    return (
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-center text-xs font-semibold text-gray-800">
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-gray-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-0.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => (
            <div key={i} className="flex aspect-square items-center justify-center p-0.5">
              {day != null ? (
                (() => {
                  const cellDate = new Date(year, month, day)
                  const t = dayMidnight(cellDate)
                  const onlyStart = startMs !== null && endMs === null
                  const sameDayRange = startMs !== null && endMs !== null && startMs === endMs
                  const spanRange = startMs !== null && endMs !== null && startMs < endMs
                  const circle =
                    (onlyStart && t === startMs) ||
                    (sameDayRange && t === startMs) ||
                    (spanRange && (t === startMs || t === endMs))
                  const between = spanRange && t > startMs && t < endMs
                  return (
                    <button
                      type="button"
                      onClick={() => handleDayClick(year, month, day)}
                      className={cn(
                        'flex h-8 w-full items-center justify-center rounded-lg text-[11px] font-medium transition-colors',
                        circle
                          ? 'bg-brand-teal text-white shadow-sm'
                          : between
                            ? 'bg-brand-teal/15 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {day}
                    </button>
                  )
                })()
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-[min(92vw,600px)] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl ring-1 ring-gray-900/5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() - 1, 1))}
          className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100"
          aria-label="Previous months"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1))}
          className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100"
          aria-label="Next months"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-3 sm:gap-4">
        {renderMonth(leftMonth)}
        {renderMonth(rightMonth)}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          onClick={handleClearClick}
        >
          Clear
        </button>
        <Button type="button" variant="primary" className="px-6 py-2 text-xs font-semibold" onClick={handleApplyClick}>
          Apply
        </Button>
      </div>
    </div>
  )
}

/**
 * @param {{ dateFrom: string, dateTo: string, onChange: (from: string, to: string) => void, label?: string, placeholder?: string, className?: string }} props
 */
export function DateRangeFilterField({ dateFrom, dateTo, onChange, label = 'Date Range', placeholder = 'Select date range', className }) {
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState(null)

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) {
      setPopoverPos(null)
      return undefined
    }
    const el = wrapRef.current
    const update = () => {
      const r = el.getBoundingClientRect()
      const w = 600
      let left = r.left
      if (left + w > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - w - 8)
      }
      let top = r.bottom + 6
      const panelHeight = 380
      if (top + panelHeight > window.innerHeight - 8) {
        top = Math.max(8, r.top - panelHeight - 6)
      }
      setPopoverPos({ top, left })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const portal =
    open &&
    popoverPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[133] cursor-default bg-transparent"
          aria-hidden
          data-date-range-filter-ui
          onClick={() => setOpen(false)}
        />
        <div className="fixed z-[138]" style={{ top: popoverPos.top, left: popoverPos.left }} data-date-range-filter-ui>
          <RangeCalendarPanel
            dateFrom={dateFrom}
            dateTo={dateTo}
            onApply={(from, to) => {
              onChange(from, to)
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      </>,
      document.body
    )

  const labelText = formatRangeButtonLabel(dateFrom, dateTo)

  return (
    <div ref={wrapRef} className={cn('relative min-w-0', className)}>
      <label className="mb-1.5 block text-xs font-semibold text-gray-900">{label}</label>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-10 flex-1 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs shadow-sm transition hover:border-brand-teal/30 focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-brand-teal" strokeWidth={2} />
            <span className={labelText ? 'truncate font-medium text-gray-900' : 'text-gray-400'}>
              {labelText || placeholder}
            </span>
          </span>
        </button>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            title="Clear dates"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
            onClick={(e) => {
              e.stopPropagation()
              onChange('', '')
              setOpen(false)
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {portal}
    </div>
  )
}
