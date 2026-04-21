"use client";

import {
  ModalHeader,
  ModalFooter,
  ModalClose,
  Button,
  COLORS,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const HEADER_CLASS = "flex items-start justify-between border-b px-6 py-4";
const FOOTER_CLASS = "flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end";

export function LeadModalHeader({
  title,
  subtitle,
  className,
  dividerColor,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  /** Use for design specs (e.g. #E9EAEB); defaults to COLORS.CARD_BORDER */
  dividerColor?: string;
}) {
  return (
    <div className={cn(HEADER_CLASS, className)} style={{ borderColor: dividerColor ?? COLORS.CARD_BORDER }}>
      <ModalHeader className="mb-0 p-0">
        <h2 className="text-lg font-bold" style={{ color: COLORS.TEXT_TITLE }}>{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{subtitle}</p>
        )}
      </ModalHeader>
      <ModalClose
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        style={{ color: COLORS.TEXT_MUTED }}
        aria-label="Close"
      >
        <span className="text-xl leading-none">×</span>
      </ModalClose>
    </div>
  );
}

export function LeadModalFooter({
  cancelLabel,
  submitLabel,
  onCancel,
  onSubmit,
  submitDisabled,
}: {
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}) {
  return (
    <ModalFooter className={cn(FOOTER_CLASS, "gap-2") } style={{ borderColor: COLORS.CARD_BORDER }}>
      <Button
        type="button"
        variant="outline"
        className="rounded-lg w-full "
        style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE }}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        className="rounded-lg text-white w-full "
        style={{ backgroundColor: COLORS.BRAND }}
        onClick={onSubmit}
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </ModalFooter>
  );
}
