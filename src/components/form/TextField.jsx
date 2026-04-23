import { forwardRef } from 'react'

/**
 * Borderless surface input for dashboards, wizards, and settings.
 * Placeholders use text-xs per design system.
 */
export const textFieldInputClassName =
  'w-full rounded-lg border-0 bg-gray-50/90 px-3 py-2.5 text-sm text-gray-900 placeholder:text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 disabled:opacity-60'

export const textFieldTextareaClassName = `${textFieldInputClassName} min-h-[120px] resize-y`

const TextField = forwardRef(function TextField({ multiline = false, className = '', rows = 4, type = 'text', ...props }, ref) {
  const combined = `${multiline ? textFieldTextareaClassName : textFieldInputClassName} ${className}`.trim()
  if (multiline) {
    return <textarea ref={ref} className={combined} rows={rows} {...props} />
  }
  return <input ref={ref} type={type} className={combined} {...props} />
})

export default TextField
