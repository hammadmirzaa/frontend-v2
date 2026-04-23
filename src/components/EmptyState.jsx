/**
 * Centered empty state for dashboard panels (lists, tables, tabs).
 * Pass a Lucide icon component as `icon`.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = '',
  /** Larger vertical padding and min-height for main content areas */
  spacious = true,
  /** Optional class on the icon wrapper (default: soft teal tile) */
  iconWrapperClassName = '',
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center px-4 text-center ${spacious ? 'min-h-[min(420px,60vh)] py-16' : 'py-12'} ${className}`}
    >
      {Icon && (

          <img src={`/svgs/${Icon}.svg`} alt={Icon} className="w-20 h-20" />

      )}
      <h3 className="max-w-md text-base font-semibold text-gray-900 sm:text-lg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
