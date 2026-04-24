import { createElement } from 'react'
import { cn } from '../utils/cn'

function resolveIconSrc(icon) {
  if (!icon || typeof icon !== 'string') return null
  const s = icon.trim()
  if (!s) return null
  if (s.endsWith('.svg')) return s.startsWith('/') ? s : `/svgs/${s}`
  if (s.startsWith('/svgs/')) return s
  /** e.g. `/admin/users` → `/svgs/admin/users.svg` */
  if (s.startsWith('/')) return `/svgs${s}.svg`
  return `/svgs/${s}.svg`
}

/**
 * Centered empty state for dashboard panels (lists, tables, tabs).
 * Fills remaining vertical space when the parent is a flex column (`flex flex-col min-h-0`) with a flex child.
 * `icon`: string key under `/public/svgs/` (e.g. `"bot2"`, `"admin/users"`), full path like `/svgs/admin/users.svg`, or a Lucide icon component.
 */
export default function EmptyState({
  icon,
  title,
  description,
  children,
  className = '',
  /** Larger vertical padding */
  spacious = true,
  /** Optional class on the icon wrapper */
  iconWrapperClassName = '',
}) {
  const iconSrc = typeof icon === 'string' ? resolveIconSrc(icon) : null
  const IconComponent = typeof icon === 'function' ? icon : null

  return (
    <div
      role="status"
      className={cn(
        'flex w-full min-h-0 flex-1 flex-col items-center justify-center px-4 text-center',
        spacious ? 'py-16 sm:py-20' : 'py-12',
        className
      )}
    >
      {IconComponent ? (
        <span className={cn('mb-2 flex items-center justify-center text-brand-teal', iconWrapperClassName)}>
          {createElement(IconComponent, {
            className: 'h-16 w-16 shrink-0',
            strokeWidth: 1.5,
            'aria-hidden': true,
          })}
        </span>
      ) : iconSrc ? (
        <span className={cn('mb-2 flex items-center justify-center', iconWrapperClassName)}>
          <img src={iconSrc} alt="" className="h-20 w-20 object-contain" />
        </span>
      ) : null}
      <h3 className="max-w-md text-base font-semibold text-gray-900 sm:text-lg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
