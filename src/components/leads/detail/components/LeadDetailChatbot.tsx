"use client";

import { CHAT_STARTED_DATE, MOCK_CHAT_MESSAGES } from "../constants";
import { DetailCard } from "./DetailCard";
import { ConversationTranscript } from "@/components/chat";
import { ImageWrapper } from "@/components/ui";

const userAvatar = (
  <ImageWrapper src="/svgs/leads/user3.svg" alt="" width={36} height={36} className="rounded-full" />
);

export function LeadDetailChatbot() {
  const messages = MOCK_CHAT_MESSAGES.map((msg) => ({
    from: msg.from === "lead" ? ("user" as const) : ("agent" as const),
    name: msg.name,
    time: msg.time,
    body: msg.body,
  }));

  return (
    <DetailCard className="">
      <ConversationTranscript
        messages={messages}
        title="Chat Conversation"
        subtitle={`Started on ${CHAT_STARTED_DATE}`}
        userAvatar={userAvatar}
      />
    </DetailCard>
  );
}
