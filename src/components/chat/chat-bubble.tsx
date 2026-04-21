"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "../ui";

export interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
  avatar?: React.ReactNode;
  className?: string;
}

export function ChatBubble({
  message,
  isUser = false,
  timestamp,
  avatar,
  className,
}: ChatBubbleProps) {
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ">
        {avatar ??
          (isUser ? (
            <ImageWrapper
              src="/svgs/user.svg"
              alt="User Avatar"
              width={30}
              height={30}
            />
          ) : (
            <ImageWrapper
              src="/svgs/bot.svg"
              alt="Bot Avatar"
              width={30}
              height={30}
            />
          ))}
      </div>
      <div
        className={cn("flex min-w-0 flex-1 flex-col", isUser && "items-end")}
      >
        <div
          className={cn(
            "max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm",
            isUser ? "text-gray-900" : "text-gray-700",
          )}
          style={{
            backgroundColor: isUser ? `${COLORS.BRAND}18` : "rgb(243 244 246)",
          }}
        >
          {message}

          {timestamp && (
            <span className="block mt-1 text-xs text-gray-500">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
