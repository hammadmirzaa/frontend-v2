"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { Breadcrumbs, Button, COLORS } from "@/components/ui";
import { ConversationTranscript } from "@/components/chat";
import {
  getConversationById,
  getMessagesForConversation,
} from "@/components/conversations/constants";
import { ImproveConversationPanel } from "@/components/conversations/components/improve-conversation-panel";

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const conversation = getConversationById(id);
  const messages = getMessagesForConversation(id);
  const [improvePanelOpen, setImprovePanelOpen] = useState(false);

  if (!conversation) {
    return (
      <AppLayout title="Conversations" className="bg-page-bg">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p style={{ color: COLORS.TEXT_MUTED }}>Conversation not found.</p>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbItems = [
    { label: "Conversations", href: "/conversations" },
    { label: conversation.chatbotName },
  ];

  return (
    <AppLayout title="Conversations" className="bg-page-bg">
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: COLORS.TEXT_TITLE }}
            >
              {conversation.title}
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              {conversation.chatbotName} • {conversation.username}
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            style={{ backgroundColor: COLORS.BRAND }}
            onClick={() => setImprovePanelOpen(true)}
          >
            Improve Conversation →
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ConversationTranscript messages={messages} />
        </div>
      </div>

      <ImproveConversationPanel
        open={improvePanelOpen}
        onClose={() => setImprovePanelOpen(false)}
        onSubmit={(feedback) => {
          // Wire to API when ready
          console.log("Feedback submitted:", feedback);
        }}
      />
    </AppLayout>
  );
}
