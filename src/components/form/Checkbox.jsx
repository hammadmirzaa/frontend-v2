import { forwardRef } from 'react'

/** Same styling as Login / Signup: brand teal when checked (`accent-brand-teal`). */
export const checkboxClassName =
  'h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-teal focus:ring-brand-teal'

const Checkbox = forwardRef(function Checkbox({ className = '', ...props }, ref) {
  return <input ref={ref} type="checkbox" className={`${checkboxClassName} ${className}`.trim()} {...props} />
})

export default Checkbox
