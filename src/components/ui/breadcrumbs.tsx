"use client";

import Link from "next/link";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className={cn("text-sm", className)}
      style={{ color: COLORS.TEXT_MUTED }}
      aria-label="Breadcrumb"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span style={isLast ? { color: COLORS.TEXT_TITLE } : undefined}>
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span className="mx-2">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
