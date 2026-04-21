"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNavItem } from "../layout/sidebar-nav-item";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "../ui";

const PLAYGROUND_SUB_ITEMS = [
  { href: "/chatbots", label: "Chatbots" },
  { href: "/guardrails", label: "Guardrails" },
  { href: "/knowledge-base", label: "Knowledge Base" },
] as const;

function IconPlaceholder({ name }: { name: string }) {
  return (
    <div className="h-5 w-5 rounded bg-gray-300" title={name} aria-hidden />
  );
}

export interface SidebarPlaygroundSectionProps {
  icon: React.ReactNode;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarPlaygroundSection({ icon, collapsed = false, onNavigate }: SidebarPlaygroundSectionProps) {
  const pathname = usePathname();
  const isPlaygroundActive =
    pathname === "/playground" || pathname.startsWith("/playground/");
  const isPlaygroundSubRoute = PLAYGROUND_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  /** Playground link stays highlighted when on /playground or any sub-route (Chatbots, Guardrails, Knowledge Base). */
  const isParentActive = isPlaygroundActive || isPlaygroundSubRoute;
  const [expanded, setExpanded] = useState(isParentActive);

  useEffect(() => {
    if (isParentActive) setExpanded(true);
  }, [isParentActive]);

  if (collapsed) {
    return (
      <SidebarNavItem
        href="/playground"
        label="Playground"
        icon={icon}
        collapsed
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-3">
        <Link
          href="/playground"
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isParentActive
              ? "text-white"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
          style={
            isParentActive ? { backgroundColor: COLORS.BRAND } : undefined
          }
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center"
            style={
              isParentActive
                ? { filter: "brightness(0) invert(1)" }
                : { filter: "brightness(0)" }
            }
          >
            {icon}
          </span>
          <span className="flex-1">Playground</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          className={cn(
            "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
            isParentActive
              ? "text-white hover:bg-white/20"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse Playground" : "Expand Playground"}
        >
          {expanded ? (
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
              <path d="m18 15-6-6-6 6" />
            </svg>
          ) : (
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
        </button>
        </Link>

      </div>
      {expanded && (
        <div className="ml-3 mt-2 border-l border-gray-200 pl-3 space-y-0.5">
          {PLAYGROUND_SUB_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              onNavigate={onNavigate}
              activeStyle="light"
              icon={<ImageWrapper src={`/svgs/${item.label.toLowerCase()}.svg`} alt={item.label} width={20} height={20} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
