"use client";

import { SearchInput } from "./search-input";
import { useSidebar } from "./sidebar-context";
import { Avatar, ImageWrapper } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  title: string;
  className?: string;
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5h16M4 12h16M4 19h16" />
    </svg>
  );
}

export function Navbar({ title, className }: NavbarProps) {
  const { toggleMobileOpen } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border border-gray-50 bg-white px-4 md:gap-6 md:px-6",
        className
      )}
    >
      <button
        type="button"
        onClick={toggleMobileOpen}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>
      <h1 className="min-w-0 truncate text-lg font-bold text-title md:text-xl">
        {title}
      </h1>
      <div className="flex min-w-0 flex-1 justify-center md:justify-end">
        <SearchInput
          placeholder="Search here..."
          className="hidden w-[240px] sm:block md:w-[320px] lg:w-[400px]"
          inputClassName="border-gray-50"
          style={{ backgroundColor: COLORS.INPUT_BG }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-title hover:bg-gray-100"
          aria-label="Notifications"
        >
          <ImageWrapper
            src="/svgs/notification.svg"
            alt=""
            width={20}
            height={20}
          />
        </button>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative shrink-0">
            <Avatar size="sm" fallback="John Doe" className="h-9 w-9" />
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: COLORS.STATUS_ONLINE }}
              aria-hidden
            />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="truncate text-sm font-semibold text-title">
              John Doe
            </span>
            <span className="truncate text-xs text-muted">
              john@example.com
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
