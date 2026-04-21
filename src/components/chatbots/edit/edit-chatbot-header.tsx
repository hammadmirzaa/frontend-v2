"use client";

import type { ChatbotRow } from "@/contexts/chatbots-context";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface EditChatbotHeaderProps {
  chatbot: ChatbotRow;
}

export function EditChatbotHeader({ chatbot }: EditChatbotHeaderProps) {
  const isActive = chatbot.status === "active";

  return (
    <div className="border-b border-gray-200 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{chatbot.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tailor your assistant&apos;s look, tone, and voice to fit your brand.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 font-semibold hover:bg-gray-50"
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              isActive ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <span>{isActive ? "Active" : "Inactive"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
