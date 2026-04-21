"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ImageWrapper, Textarea } from "@/components/ui";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";

export interface MessageInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onStartVoice?: () => void;
  className?: string;
}

export function MessageInput({
  placeholder = "Type your message...",
  onSend,
  onStartVoice,
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSend?.(trimmed);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs",
          "flex flex-col p-4"
        )}
      >
        <div className="flex min-h-[60px] items-start gap-1">
          <span
            className="flex h-10 w-10 shrink-0 items-start justify-center text-brand"
            aria-hidden
          >
            <Sparkles className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={cn(
              "min-h-[60px] flex-1 resize-none border-0 bg-transparent p-0 text-sm",
              "placeholder:text-gray-500 focus:outline-none focus:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          {onStartVoice && (
            <Button
              type="button"
              variant="outline"
              onClick={onStartVoice}
              className="py-0.5 rounded-xl border px-4 font-bold"
              style={{
                borderColor: COLORS.BRAND_BORDER,
                color: COLORS.BRAND_TITLE,
                backgroundColor: "transparent",
              }}
            >
              Start Voice Chat
            </Button>
          )}
          <Button
            type="submit"
            className=" gap-2 rounded-xl px-6 font-bold text-white"
            style={{ backgroundColor: COLORS.BRAND }}
          >
            <ImageWrapper
              src="/svgs/send.svg"
              alt=""
              width={18}
              height={18}
              className="[&_img]:invert"
            />
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
