import { cn } from '../../utils/cn'

/**
 * Shared button styles — primary (teal), outline, ghost, danger (destructive red).
 *
 * @param {object} props
 * @param {'primary' | 'outline' | 'ghost' | 'danger'} [props.variant]
 * @param {string} [props.className]
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'primary',
  type = 'button',
  className,
  disabled,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-brand-teal border border-brand-teal px-5 text-white hover:bg-brand-teal-hover',
        variant === 'outline' &&
          'border border-brand-teal bg-white text-brand-teal hover:bg-gray-50/80',
        variant === 'ghost' && 'rounded-lg border border-transparent bg-transparent text-gray-700 hover:bg-gray-100',
        variant === 'danger' &&
          'border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
