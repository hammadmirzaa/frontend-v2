"use client";

import { SearchInput } from "@/components/layout/search-input";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface ListSidebarProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Optional slot below search (e.g. "Sort by" dropdown) – full width, same visual weight as search */
  headerBottomSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ListSidebar({
  title,
  subtitle,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  headerBottomSlot,
  children,
  className,
}: ListSidebarProps) {
  return (
    <section
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:w-[320px]",
        className
      )}
    >
      <div className="shrink-0 border-b border-gray-200 p-4">
        <h2
          className="text-lg font-bold"
          style={{ color: COLORS.TEXT_TITLE }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0 space-y-3 p-4">
        <SearchInput
          placeholder={searchPlaceholder}
          className="w-full max-w-full"
          inputClassName="h-10 w-full rounded-lg border-0 bg-gray-100 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200"
          value={searchValue}
          onChange={onSearchChange}
          style={{ backgroundColor: COLORS.GRAY_100 }}
        />
        {headerBottomSlot}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
        {children}
      </div>
    </section>
  );
}
