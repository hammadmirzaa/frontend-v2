"use client";

import Link from "next/link";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarPlaygroundSection } from "../playground/sidebar-playground-section";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { COLORS, ImageWrapper } from "../ui";

const FEATURES_AFTER_PLAYGROUND = [
  { href: "/leads", label: "Leads" },
  { href: "/follow-ups", label: "Follow Ups" },
  { href: "/conversations", label: "Conversations" },
] as const;

const GENERAL = [
  { href: "/settings", label: "Settings" },
  { href: "/logout", label: "Logout" },
] as const;

export function Sidebar() {
  const {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    isMobile,
  } = useSidebar();
  const effectiveCollapsed = collapsed && !isMobile;

  return (
    <>
      {mobileOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white shadow-sm duration-200 transition-[transform] md:transition-[width]",
          "w-64 -translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
          collapsed ? "md:w-16" : "md:w-64"
        )}
      >
      <div
        className={cn(
          "flex h-16 items-center border-b border-gray-100 shrink-0 transition-[padding] duration-200",
          effectiveCollapsed ? "justify-center px-0" : "justify-between gap-2 px-6"
        )}
      >
        {!effectiveCollapsed && (
          <Link href="/" className="flex min-w-0 items-center gap-2 cursor-pointer">
            <span className="truncate font-semibold text-lg " style={{ color: COLORS.BRAND_TITLE }} >Meichat</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors",
            effectiveCollapsed ? "h-10 w-10" : "h-8 w-8"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ImageWrapper
            src="/svgs/sidebar.svg"
            alt=""
            width={20}
            height={20}
          />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!effectiveCollapsed && (
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Features
          </p>
        )}
        <ul className="space-y-0.5">
          <li>
            <SidebarPlaygroundSection
              collapsed={effectiveCollapsed}
              onNavigate={() => setMobileOpen(false)}
              icon={<ImageWrapper src="/svgs/playground.svg" alt="Playground" width={20} height={20} />}
            />
          </li>
          {FEATURES_AFTER_PLAYGROUND.map((item) => (
            <li key={item.href}>
              <SidebarNavItem
                href={item.href}
                label={item.label}
                collapsed={effectiveCollapsed}
                onNavigate={() => setMobileOpen(false)}
                icon={<ImageWrapper src={`/svgs/${item.label.toLowerCase()}.svg`} alt={item.label} width={20} height={20} />}
              />
            </li>
          ))}
        </ul>
        {!effectiveCollapsed && (
          <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            General
          </p>
        )}
        <ul className={cn("space-y-0.5", effectiveCollapsed && "mt-6")}>
          {GENERAL.map((item) => (
            <li key={item.href}>
              <SidebarNavItem
                href={item.href}
                label={item.label}
                collapsed={effectiveCollapsed}
                onNavigate={() => setMobileOpen(false)}
                icon={<ImageWrapper src={`/svgs/${item.label.toLowerCase()}.svg`} alt={item.label} width={20} height={20} />}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
    </>
  );
}
