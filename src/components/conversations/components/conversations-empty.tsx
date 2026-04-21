"use client";

import { MessageCircle } from "lucide-react";
import { EmptyState, ImageWrapper } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

export interface ConversationsEmptyProps {
  className?: string;
}

export function ConversationsEmpty({ className }: ConversationsEmptyProps) {
  return (
    <div className={`flex min-h-[76vh] w-full ${className ?? ""}`}>
      <EmptyState
        icon={
          <ImageWrapper src="/svgs/conversations/chat.svg" alt="Conversations Empty" width={64} height={64} />
        }
        title="No conversations yet"
        description="Once you begin a conversation, it will appear here."
        className="flex-1"
        iconContainerClassName="bg-brand-active"
        iconContainerStyle={{ backgroundColor: COLORS.BRAND_ACTIVE_BG }}
      />
    </div>
  );
}
