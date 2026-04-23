import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Reusable select dropdown for forms/settings pages.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} [props.helperText]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {'default' | 'field' | 'pill'} [props.variant] — `field` matches TextField; `pill` is teal-on-mint rounded trigger (e.g. template picker)
 * @param {import('react').ReactNode} [props.leading] — icon or label before the value (inside the trigger)
 * @param {string[]} [props.excludeValuesFromMenu] — option values not shown as rows (e.g. placeholder `''`)
 * @param {boolean} [props.fieldBorderless] — when `variant="field"`, no stroke on trigger (fills only)
 */
export function SelectDropdown({
  label,
  value,
  onChange,
  options,
  helperText,
  className,
  disabled = false,
  variant = 'default',
  leading = null,
  excludeValuesFromMenu = [],
  fieldBorderless = false,
}) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
    placement: 'bottom',
  })
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const normalizedOptions = Array.isArray(options) ? options : []
  const selected = useMemo(
    () => normalizedOptions.find((o) => o.value === value) ?? normalizedOptions[0] ?? null,
    [normalizedOptions, value]
  )

  const menuRowOptions = useMemo(
    () => normalizedOptions.filter((o) => !excludeValuesFromMenu.includes(o.value)),
    [normalizedOptions, excludeValuesFromMenu]
  )

  /** Aligns with Tailwind max-h-60 (15rem ≈ 240px at default root font size). */
  const MENU_MAX_PX = 240
  const MENU_GAP_PX = 4
  const VIEWPORT_MARGIN_PX = 8

  const updateMenuPosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()

    const estimateFromOptions = Math.min(
      menuRowOptions.length * 40 + 12,
      MENU_MAX_PX
    )
    let menuHeight = estimateFromOptions
    if (menuRef.current) {
      const measured = Math.max(menuRef.current.scrollHeight, estimateFromOptions)
      menuHeight = Math.min(measured, MENU_MAX_PX)
    }

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN_PX
    const spaceAbove = rect.top - VIEWPORT_MARGIN_PX

    const fitsBelow = menuHeight <= spaceBelow - MENU_GAP_PX
    const fitsAbove = menuHeight <= spaceAbove - MENU_GAP_PX

    /** Open upward when there isn’t enough room below and upward is better (or only) option. */
    const openUp =
      (!fitsBelow && fitsAbove) || (!fitsBelow && !fitsAbove && spaceAbove > spaceBelow)

    let top
    let maxHeight
    let placement

    if (openUp) {
      placement = 'top'
      maxHeight = Math.min(MENU_MAX_PX, Math.max(spaceAbove - MENU_GAP_PX, 120))
      const visibleH = Math.min(menuHeight, maxHeight)
      top = rect.top - visibleH - MENU_GAP_PX
      top = Math.max(VIEWPORT_MARGIN_PX, top)
    } else {
      placement = 'bottom'
      maxHeight = Math.min(MENU_MAX_PX, Math.max(spaceBelow - MENU_GAP_PX, 120))
      top = rect.bottom + MENU_GAP_PX
    }

    setMenuPosition({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement,
    })
  }

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    updateMenuPosition()
    const id = requestAnimationFrame(() => updateMenuPosition())
    return () => cancelAnimationFrame(id)
  }, [open, menuRowOptions.length])

  useEffect(() => {
    if (!open) return undefined
    const onReposition = () => updateMenuPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('space-y-2', className)}>
      {label ? <label className="block text-sm font-semibold text-gray-900">{label}</label> : null}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!disabled) {
              setOpen((v) => {
                const next = !v
                if (next) updateMenuPosition()
                return next
              })
            }
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/20',
            Boolean(leading) && 'flex items-center gap-2.5',
            variant === 'pill' &&
              'flex items-center justify-between gap-3 rounded-2xl border-0 bg-[#F1F9F9] px-4 py-2.5 text-brand-teal disabled:cursor-not-allowed disabled:opacity-60',
            variant === 'field' &&
              cn(
                'min-h-[2.75rem] items-center rounded-lg bg-gray-50 px-3 py-2.5 pr-10 text-gray-900 disabled:cursor-not-allowed disabled:opacity-60',
                fieldBorderless
                  ? cn(
                      'border-0 shadow-none hover:bg-gray-100/90',
                      open ? 'bg-gray-100/95' : ''
                    )
                  : cn(
                      'border',
                      open ? 'border-brand-teal shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    )
              ),
            variant === 'default' &&
              'rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-gray-900 focus:border-brand-teal disabled:cursor-not-allowed disabled:bg-gray-100'
          )}
        >
          {leading ? <span className="pointer-events-none shrink-0">{leading}</span> : null}
          <span className="block min-w-0 flex-1 truncate">{selected?.label ?? ''}</span>
          {variant === 'pill' ? (
            <ChevronDown
              className={cn(
                'pointer-events-none h-4 w-4 shrink-0 text-brand-teal transition-transform',
                open && 'rotate-180'
              )}
              aria-hidden
            />
          ) : null}
        </button>
        {variant !== 'pill' ? (
          <ChevronDown
            className={cn(
              'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-transform',
              open && 'rotate-180'
            )}
            aria-hidden
          />
        ) : null}
      </div>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              className="fixed z-[140] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: `${menuPosition.width}px`,
                maxHeight: `${menuPosition.maxHeight}px`,
              }}
            >
              {menuRowOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      isSelected ? 'bg-brand-teal text-white' : 'text-gray-800 hover:bg-gray-50'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} /> : null}
                  </button>
                )
              })}
            </div>,
            document.body
          )
        : null}
      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
    </div>
  )
}
