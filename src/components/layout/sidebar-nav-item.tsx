"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  showChevron?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  /** When true, active state uses light purple (#F3F1FF) and dark text instead of solid brand purple. Use for sub-items (e.g. Chatbots, Guardrails, Knowledge Base). */
  activeStyle?: "brand" | "light";
}

export function SidebarNavItem({
  href,
  label,
  icon,
  showChevron = false,
  collapsed = false,
  onNavigate,
  activeStyle = "brand",
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const useLightActive = activeStyle === "light" && isActive;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-lg text-sm font-medium transition-colors",
        collapsed
          ? "justify-center p-2.5"
          : "gap-3 px-3 py-2.5",
        useLightActive
          ? "text-gray-900"
          : isActive
            ? "text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      )}
      style={
        useLightActive
          ? { backgroundColor: COLORS.BRAND_ACTIVE_BG }
          : isActive
            ? { backgroundColor: COLORS.BRAND }
            : undefined
      }
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        style={
          isActive && !useLightActive
            ? { filter: "brightness(0) invert(1)" }
            : { filter: "brightness(0)" }
        }
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {showChevron && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </>
      )}
    </Link>
  );
}
