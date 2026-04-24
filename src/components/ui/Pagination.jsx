import { cn } from '../../utils/cn'
import { COLORS } from '../../lib/designTokens'
import { Button } from './Button'

/** @typedef {number | 'ellipsis'} PageItem */

/**
 * Compact window: always page 1, current, next page when it exists, and last page;
 * ellipses fill gaps (same idea as common dashboard pagination).
 * @param {number} currentPage
 * @param {number} totalPages
 * @returns {PageItem[]}
 */
function getPageItems(currentPage, totalPages) {
  const current = Math.min(Math.max(1, currentPage), totalPages)
  if (totalPages <= 1) {
    return [1]
  }

  /** @type {Set<number>} */
  const set = new Set([1, totalPages, current])
  if (current < totalPages) {
    set.add(current + 1)
  }

  for (const p of [...set]) {
    if (typeof p !== 'number' || p < 1 || p > totalPages) set.delete(p)
  }

  const sorted = [...set].sort((a, b) => a - b)

  /** @type {PageItem[]} */
  const out = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      out.push('ellipsis')
    }
    out.push(sorted[i])
  }
  return out
}

/**
 * @param {object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onPageChange
 * @param {string} [props.className]
 */
export function Pagination({ currentPage, totalPages, onPageChange, className }) {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, currentPage), safeTotal)
  const isFirstPage = safePage <= 1
  const isLastPage = safePage >= safeTotal
  const pageItems = getPageItems(safePage, safeTotal)

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 px-4 pt-4 sm:px-6', className)}>
      <p className="text-xs font-medium" style={{ color: COLORS.GRAY_600 }}>
        Page {safePage} of {safeTotal}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isFirstPage}
          onClick={() => onPageChange(safePage - 1)}
          className={cn(
            'h-9 min-w-[86px] border-0 px-4 py-2 text-sm font-normal shadow-none',
            isFirstPage
              ? 'cursor-not-allowed bg-transparent text-gray-400 hover:bg-transparent hover:text-gray-400'
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-500'
          )}
        >
          Previous
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          {pageItems.map((item, i) => {
            if (item === 'ellipsis') {
              return (
                <span key={`ellipsis-${i}`} className="px-0.5 text-sm font-normal text-gray-500">
                  ...
                </span>
              )
            }
            const isActive = safePage === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={cn(
                  'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-normal text-gray-500 transition-colors',
                  !isActive && 'bg-transparent hover:bg-gray-100'
                )}
                style={isActive ? { backgroundColor: COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG, color: COLORS.BRAND } : undefined}
              >
                {String(item).padStart(2, '0')}
              </button>
            )
          })}
        </div>
        <Button
          type="button"
          variant={isLastPage ? 'outline' : 'primary'}
          disabled={isLastPage}
          onClick={() => onPageChange(safePage + 1)}
          className={cn(
            'h-9 min-w-[60px] px-4 py-2 text-sm font-normal',
            isLastPage && 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-50 hover:text-gray-400'
          )}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
