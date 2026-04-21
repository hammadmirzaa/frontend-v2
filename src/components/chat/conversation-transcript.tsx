"use client";

import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Message in a conversation (user/lead on one side, agent/bot on the other). */
export interface ConversationMessage {
  /** "user" | "lead" = right-aligned; "agent" = left-aligned */
  from: "user" | "agent" | "lead";
  name: string;
  time: string;
  body: string;
}

export interface ConversationTranscriptProps {
  messages: ConversationMessage[];
  /** Optional title above the transcript (e.g. "Chat Conversation") */
  title?: string;
  /** Optional subtitle (e.g. "Started on ...") */
  subtitle?: string;
  className?: string;
  /** Avatar for user/lead side; default user icon */
  userAvatar?: React.ReactNode;
  /** Avatar for agent side; default bot icon */
  agentAvatar?: React.ReactNode;
}

const defaultUserAvatar = (
  <ImageWrapper src="/svgs/user.svg" alt="" width={36} height={36} className="rounded-full" />
);
const defaultAgentAvatar = (
  <div
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
    style={{ backgroundColor: `${COLORS.BRAND}20` }}
  >
    <ImageWrapper src="/svgs/bot2.svg" alt="" width={20} height={20} />
  </div>
);

export function ConversationTranscript({
  messages,
  title,
  subtitle,
  className,
  userAvatar = defaultUserAvatar,
  agentAvatar = defaultAgentAvatar,
}: ConversationTranscriptProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title != null || subtitle != null) && (
        <>
          {title != null && (
            <h2 className="mb-2 text-lg font-bold pt-6 px-6" style={{ color: COLORS.TEXT_TITLE }}>
              {title}
            </h2>
          )}
          {subtitle != null && (
            <p className="m-0 text-sm px-6" style={{ color: COLORS.TEXT_MUTED }}>
              {subtitle}
            </p>
          )}
          <hr className="my-4" style={{ borderColor: COLORS.CARD_BORDER_LIGHT }} />
        </>
      )}
<div
  className={cn(
    "space-y-6 px-6 pb-6",
    title != null || subtitle != null && "mt-6"
  )}
>
        {messages.map((msg, i) => {
          const isAgent = msg.from === "agent";
          return (
            <div
              key={i}
              className={cn("flex gap-3", isAgent ? "" : "flex-row-reverse")}
            >
              <div className="shrink-0">
                {isAgent ? agentAvatar : userAvatar}
              </div>
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col",
                  isAgent ? "" : "items-end"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: COLORS.TEXT_TITLE }}>
                    {msg.name}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    {msg.time}
                  </p>
                </div>
                <div
                  className="max-w-[50%] rounded-2xl px-4 py-3 text-sm"
                  style={{
                    backgroundColor: isAgent ? COLORS.BRAND_ACTIVE_BG : COLORS.GRAY_100,
                    color: COLORS.TEXT_BODY,
                  }}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
