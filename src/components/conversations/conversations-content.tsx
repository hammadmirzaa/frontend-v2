"use client";

import { AppLayout } from "@/components/layout";
import { COLORS } from "@/lib/design-tokens";
import { useChatbotsOptional } from "@/contexts/chatbots-context";
import { ConversationsList } from "./components/conversations-list";
import { ConversationsEmpty } from "./components/conversations-empty";

export function ConversationsContent() {
  const chatbotsContext = useChatbotsOptional();
  const chatbots = chatbotsContext?.chatbots ?? [];
  const hasChatbots = chatbots.length > 0; // true if there is data

  return (
    <AppLayout title="Conversations" className="bg-page-bg">
      <div className="space-y-8">
        {!hasChatbots ? (
          <div>
            <ConversationsList />
          </div>
        ) : (
          <>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: COLORS.TEXT_TITLE }}
              >
                All Conversations
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Manage all your ongoing chats and messages.
              </p>
            </div>

            <div className="border-t border-gray-200">
              <ConversationsEmpty />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}