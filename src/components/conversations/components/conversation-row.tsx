"use client";

import Link from "next/link";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ConversationRowProps {
  title: string;
  /** e.g. "Chatbot Name · 2 · Username" or ReactNode with icon */
  subtitle: React.ReactNode;
  timestamp: string;
  /** When set, the row renders as a link to the conversation detail. */
  href?: string;
  onClick?: () => void;
  className?: string;
}

const rowClassName =
  "flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50";

function ConversationIcon() {
  return (
    <ImageWrapper src="/svgs/conversations/chat.svg" alt="" width={40} height={40} />
  );
}

function ConversationRowContent({
  title,
  subtitle,
  timestamp,
}: Pick<ConversationRowProps, "title" | "subtitle" | "timestamp">) {
  return (
    <>
      <ConversationIcon />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>
          {title}
        </p>
        <div className="flex items-center gap-1.5 truncate text-xs" style={{ color: COLORS.TEXT_MUTED }}>
          {subtitle}
        </div>
      </div>
      <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
        {timestamp}
      </span>
    </>
  );
}

export function ConversationRow({
  title,
  subtitle,
  timestamp,
  href,
  onClick,
  className,
}: ConversationRowProps) {
  if (href) {
    return (
      <Link href={href} className={cn(rowClassName, className)}>
        <ConversationRowContent title={title} subtitle={subtitle} timestamp={timestamp} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(rowClassName, className)}
    >
      <ConversationRowContent title={title} subtitle={subtitle} timestamp={timestamp} />
    </button>
  );
}
