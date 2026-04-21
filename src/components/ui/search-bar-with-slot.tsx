"use client";

import { SearchInput } from "@/components/layout/search-input";
import { cn } from "@/lib/utils";

export interface SearchBarWithSlotProps {
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Optional right-side content (e.g. Filters button for Conversations) */
  rightSlot?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function SearchBarWithSlot({
  placeholder = "Search...",
  searchValue,
  onSearchChange,
  rightSlot,
  className,
  inputClassName,
}: SearchBarWithSlotProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <SearchInput
          placeholder={placeholder}
          className="max-w-full"
          inputClassName={inputClassName}
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>
      {rightSlot != null && (
        <div className="shrink-0">{rightSlot}</div>
      )}
    </div>
  );
}
