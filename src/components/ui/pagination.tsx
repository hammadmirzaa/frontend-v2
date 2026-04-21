"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem = number | "left-ellipsis" | "right-ellipsis";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: PageItem[] = [1];
  if (currentPage > 3) items.push("left-ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i);
  }
  if (currentPage < totalPages - 2) items.push("right-ellipsis");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <p className="text-xs font-medium" style={{ color: COLORS.GRAY_600 }}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={cn(
            "h-9 min-w-[86px] rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
            isFirstPage ? "cursor-not-allowed opacity-50" : "hover:bg-gray-200"
          )}
          style={{ backgroundColor: COLORS.GRAY_200, color: COLORS.GRAY_600 }}
        >
          Previous
        </button>
        <div className="flex items-center gap-3">
          {pageItems.map((item, i) => {
            if (item === "left-ellipsis" || item === "right-ellipsis") {
              return (
                <span key={`${item}-${i}`} className="text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>
                  ...
                </span>
              );
            }
            const isActive = currentPage === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  !isActive && "hover:bg-transparent"
                )}
                style={{
                  backgroundColor: isActive ? COLORS.BRAND_ACTIVE_BG : "transparent",
                  color: isActive ? COLORS.BRAND : COLORS.TEXT_TITLE,
                }}
              >
                {String(item).padStart(2, "0")}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={cn(
            "h-9 min-w-[60px] rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer",
            isLastPage ? "cursor-not-allowed opacity-50" : "hover:opacity-90"
          )}
          style={{ backgroundColor: COLORS.BRAND }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
