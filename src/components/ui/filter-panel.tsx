"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { Button, COLORS, zIndex } from "@/components/ui";
import { cn } from "@/lib/utils";

const VIEWPORT_PADDING = 16;
const GAP = 8;
const PANEL_WIDTH = 320;
const ESTIMATED_HEIGHT = 420;

const FILTER_STYLES = {
  BORDER: COLORS.GRAY_200,
  TITLE: COLORS.BRAND_TITLE,
  CLEAR_BORDER: COLORS.BRAND_BORDER,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface FilterPanelProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Called when panel should close (e.g. click outside, escape) */
  onClose: () => void;
  /** Ref to the trigger button for click-outside detection */
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  /** Panel title (e.g. "Filter Options") */
  title?: string;
  /** Filter form content (labels + inputs) */
  children: React.ReactNode;
  /** Called when "Clear Filters" is clicked. Caller should reset filters and may call onClose. */
  onClear: () => void;
  /** Called when "Apply Filters" is clicked. Caller should apply filters and may call onClose. */
  onApply: () => void;
  /** Position of the panel relative to trigger: "left" (default) or "right" */
  positionAnchor?: "left" | "right";
  /** Optional class for the panel container (e.g. max-width overrides) */
  className?: string;
}

export function FilterPanel({
  open,
  onClose,
  anchorRef,
  title = "Filter Options",
  children,
  onClear,
  onApply,
  positionAnchor = "left",
  className,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return;
      // Don't close when clicking inside portaled date picker calendar (it's rendered in document.body)
      if ((target as Element).closest?.("[data-filter-datepicker-portal]"))
        return;
      onClose();
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setLayout(null);
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, vw - VIEWPORT_PADDING * 2);
    const maxHeight = vh - VIEWPORT_PADDING * 2;

    let left =
      positionAnchor === "right"
        ? rect.right - width
        : rect.left;
    left = clamp(left, VIEWPORT_PADDING, vw - width - VIEWPORT_PADDING);

    let top = rect.bottom + GAP;
    const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
    const spaceAbove = rect.top - VIEWPORT_PADDING;
    if (spaceBelow < Math.min(ESTIMATED_HEIGHT, maxHeight) && spaceAbove > spaceBelow) {
      top = rect.top - GAP - Math.min(ESTIMATED_HEIGHT, maxHeight);
    }
    top = clamp(top, VIEWPORT_PADDING, vh - Math.min(ESTIMATED_HEIGHT, maxHeight) - VIEWPORT_PADDING);

    setLayout({ top, left, width, maxHeight });
  }, [open, anchorRef, positionAnchor]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-10 flex flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-lg sm:min-w-[280px]",
        className
      )}
      style={{
        borderColor: FILTER_STYLES.BORDER,
        zIndex: zIndex.dropdown,
        top: layout?.top ?? 0,
        left: layout?.left ?? 0,
        width: layout?.width ?? PANEL_WIDTH,
        maxHeight: layout != null ? `${layout.maxHeight}px` : undefined,
        visibility: layout == null ? "hidden" : undefined,
      }}
    >
      <h3 className="mb-4 shrink-0 text-base font-bold" style={{ color: FILTER_STYLES.TITLE }}>
        {title}
      </h3>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4">{children}</div>
      </div>

      <hr
        role="separator"
        className="my-6 shrink-0 border-t"
        style={{ borderColor: FILTER_STYLES.BORDER }}
      />

      <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-lg border bg-white"
          style={{ borderColor: FILTER_STYLES.CLEAR_BORDER, color: FILTER_STYLES.TITLE }}
          onClick={onClear}
        >
          Clear Filters
        </Button>
        <Button
          type="button"
          className="flex-1 rounded-lg text-white"
          style={{ backgroundColor: COLORS.BRAND }}
          onClick={onApply}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
