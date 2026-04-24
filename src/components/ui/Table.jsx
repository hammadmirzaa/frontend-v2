import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { COLORS } from '../../lib/designTokens'

/** Default max height for dashboard tables; grows with content, scrolls when taller. */
export const TABLE_VIEWPORT_MAX_HEIGHT_CLASS = 'max-h-[calc(100vh-26rem)]'

/** @deprecated Use `TABLE_VIEWPORT_MAX_HEIGHT_CLASS` */
export const TABLE_VIEWPORT_HEIGHT_CLASS = TABLE_VIEWPORT_MAX_HEIGHT_CLASS

/**
 * @template T
 * @typedef {object} TableColumn
 * @property {string} id
 * @property {string} label
 * @property {boolean} [sortable]
 * @property {(row: T) => import('react').ReactNode} [render]
 * @property {keyof T | ((row: T) => import('react').ReactNode)} [accessor]
 * @property {string} [headerClassName]
 * @property {string} [cellClassName]
 */

function SortColumnIcon({ columnId, sortColumnId, sortDirection }) {
  const active = sortColumnId === columnId && sortDirection
  if (active === 'asc') {
    return <ArrowUp className="h-4 w-4 shrink-0 text-brand-teal" strokeWidth={2} aria-hidden />
  }
  if (active === 'desc') {
    return <ArrowDown className="h-4 w-4 shrink-0 text-brand-teal" strokeWidth={2} aria-hidden />
  }
  return <ArrowUpDown className="h-4 w-4 shrink-0 text-brand-teal" strokeWidth={2} aria-hidden />
}

/**
 * @template T
 * @param {T} row
 * @param {TableColumn<T>} col
 */
function getCellContent(row, col) {
  if (col.render) return col.render(row)
  if (col.accessor === undefined) return null
  if (typeof col.accessor === 'function') return col.accessor(row)
  const v = row[col.accessor]
  return v != null ? String(v) : ''
}

/**
 * @template T
 * @param {object} props
 * @param {TableColumn<T>[]} props.columns
 * @param {T[]} props.data
 * @param {(row: T) => string} props.keyExtractor
 * @param {string} [props.headerBackground]
 * @param {import('react').ReactNode} [props.sortIconPlaceholder]
 * @param {string} [props.className] — merged into the scroll container (padding, etc.)
 * @param {string} [props.maxHeightClassName] — max-height utilities; default `TABLE_VIEWPORT_MAX_HEIGHT_CLASS`
 * @param {string} [props.minWidth]
 * @param {(columnId: string) => void} [props.onSortClick]
 * @param {string | null} [props.sortColumnId] — active sort column, or null for original order
 * @param {'asc' | 'desc' | null} [props.sortDirection]
 * @param {(row: T) => void} [props.onRowClick]
 */
export function Table({
  columns,
  data,
  keyExtractor,
  headerBackground,
  sortIconPlaceholder,
  className,
  maxHeightClassName = TABLE_VIEWPORT_MAX_HEIGHT_CLASS,
  /** @deprecated Use maxHeightClassName */
  heightClassName,
  minWidth = '640px',
  onSortClick,
  onRowClick,
  sortColumnId = null,
  sortDirection = null,
}) {
  const headerBg = headerBackground ?? COLORS.TABLE_HEADER_BG
  const capClass = heightClassName ?? maxHeightClassName

  return (
    <div
      className={cn(
        'min-h-0 overflow-x-auto overflow-y-auto pt-4 sm:pt-6',
        capClass,
        className
      )}
    >
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-200" style={{ backgroundColor: headerBg }}>
            {columns.map((col) => (
              <th key={col.id} className={cn('px-4 py-3 text-left text-sm font-bold text-gray-900 sm:px-6 sm:py-4', col.headerClassName)}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortClick?.(col.id)}
                    className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md text-left hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30"
                    aria-sort={
                      sortColumnId === col.id && sortDirection === 'asc'
                        ? 'ascending'
                        : sortColumnId === col.id && sortDirection === 'desc'
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <span className="text-sm font-bold text-gray-900">{col.label}</span>
                    <span className="inline-flex shrink-0" aria-hidden>
                      {sortIconPlaceholder ? (
                        sortIconPlaceholder
                      ) : (
                        <SortColumnIcon
                          columnId={col.id}
                          sortColumnId={sortColumnId}
                          sortDirection={sortDirection}
                        />
                      )}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'bg-white transition-colors hover:bg-gray-50',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td key={col.id} className={cn('px-4 py-3 text-sm text-gray-900 sm:px-6 sm:py-4', col.cellClassName)}>
                  {getCellContent(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
