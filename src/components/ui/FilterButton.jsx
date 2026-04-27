import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const FilterButton = forwardRef(function FilterButton(
  { active = false, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-teal/40 bg-brand-teal/[0.06] text-brand-teal'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
