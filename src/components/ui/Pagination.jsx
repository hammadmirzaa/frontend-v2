import { cn } from '../../utils/cn'
import { COLORS } from '../../lib/designTokens'
import { Button } from './Button'

/** @typedef {number | 'left-ellipsis' | 'right-ellipsis'} PageItem */

/**
 * @param {number} currentPage
 * @param {number} totalPages
 * @returns {PageItem[]}
 */
function getPageItems(currentPage, totalPages) {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items = [1]
  if (currentPage > 3) items.push('left-ellipsis')
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i)
  }
  if (currentPage < totalPages - 2) items.push('right-ellipsis')
  if (totalPages > 1) items.push(totalPages)
  return items
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
            'h-9 min-w-[86px] border-0 bg-gray-200 px-4 py-2 font-medium text-gray-600 shadow-none hover:bg-gray-300/80 hover:text-gray-700'
          )}
        >
          Previous
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          {pageItems.map((item, i) => {
            if (item === 'left-ellipsis' || item === 'right-ellipsis') {
              return (
                <span key={`${item}-${i}`} className="text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>
                  ...
                </span>
              )
            }
            const isActive = safePage === item
            return (
              <Button
                key={item}
                type="button"
                variant="ghost"
                onClick={() => onPageChange(item)}
                className={cn(
                  'h-9 min-w-[2.25rem] px-2 font-medium',
                  isActive
                    ? 'border-0 bg-brand-teal/[0.12] text-brand-teal hover:bg-brand-teal/[0.18] hover:text-brand-teal'
                    : 'border-0 bg-transparent text-gray-900 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {String(item).padStart(2, '0')}
              </Button>
            )
          })}
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={isLastPage}
          onClick={() => onPageChange(safePage + 1)}
          className="h-9 min-w-[60px] px-4 py-2"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
