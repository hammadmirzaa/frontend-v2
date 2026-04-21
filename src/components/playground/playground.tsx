"use client";

import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import {
  ChatBubble,
  MessageInput,
} from "@/components/chat";
import { SelectChatbotModal } from "@/components/playground/chatbot";
import { Button, COLORS, ImageWrapper, ListSidebar, SidebarListItem } from "@/components/ui";

type Session = { id: string; title: string; meta: string };
type Message = { id: string; message: string; isUser: boolean; timestamp: string };

function formatMessageTitle(text: string, maxLen = 30) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim() + "...";
}

export default function PlaygroundPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messagesBySession, setMessagesBySession] = useState<Record<string, Message[]>>({});
  const [currentChatbotId, setCurrentChatbotId] = useState<string | null>("1");

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : sessions;

  const currentMessages = selectedSessionId
    ? messagesBySession[selectedSessionId] ?? []
    : [];

  const handleSendMessage = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        message: trimmed,
        isUser: true,
        timestamp: timeStr,
      };

      if (sessions.length === 0) {
        const newId = `s-${Date.now()}`;
        const title = formatMessageTitle(trimmed);
        const newSession: Session = {
          id: newId,
          title,
          meta: "Just now",
        };
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          message: "Hello! I received your message. How can I help you today?",
          isUser: false,
          timestamp: timeStr,
        };
        setSessions([newSession]);
        setSelectedSessionId(newId);
        setMessagesBySession((prev) => ({
          ...prev,
          [newId]: [userMsg, botMsg],
        }));
      } else if (selectedSessionId) {
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          message: "Thanks for your message. I'll get back to you shortly.",
          isUser: false,
          timestamp: timeStr,
        };
        setMessagesBySession((prev) => ({
          ...prev,
          [selectedSessionId]: [
            ...(prev[selectedSessionId] ?? []),
            userMsg,
            botMsg,
          ],
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSessionId ? { ...s, meta: "Just now" } : s
          )
        );
      }
    },
    [sessions.length, selectedSessionId]
  );

  const hasActiveSession = sessions.length > 0 && selectedSessionId;

  return (
    <AppLayout title="Playground">
      <div className="flex min-h-[max(24rem,calc(100vh-6rem))] flex-col gap-2 lg:flex-row lg:h-[calc(100vh-7rem)] md:gap-4">
        <ListSidebar
          title="Chat Sessions"
          subtitle="Recent conversations for this bot"
          searchPlaceholder="Search chats..."
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No chat sessions
            </p>
          ) : filteredSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No matching sessions
            </p>
          ) : (
            filteredSessions.map((session) => (
              <SidebarListItem
                key={session.id}
                title={session.title}
                subtitle={session.meta}
                selected={selectedSessionId === session.id}
                onClick={() => setSelectedSessionId(session.id)}
              />
            ))
          )}
        </ListSidebar>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 pb-6 shadow-sm md:p-6 md:pb-6">
          {hasActiveSession ? (
            <>
              <div className="mb-4 flex shrink-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">Title</h2>
                  <p className="text-sm text-gray-500">
                    Ask questions about your uploaded documents
                  </p>
                </div>
                <SelectChatbotModal
                  selectedChatbotId={currentChatbotId}
                  onSelect={(id) => setCurrentChatbotId(id)}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full shrink-0 rounded-lg bg-white font-bold sm:w-auto"
                    style={{
                      color: COLORS.BRAND_TITLE,
                      borderColor: COLORS.BRAND_BORDER,
                    }}
                  >
                    Chatbot Name
                    <ImageWrapper
                      src="/svgs/chatbotname.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                  </Button>
                </SelectChatbotModal>
              </div>

              <hr className="mb-4 shrink-0 border-gray-200 sm:mb-8" />

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain sm:space-y-6">
                {currentMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.message}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8">
              <p className="text-center text-sm text-gray-500">
                Type a message below to start a new conversation
              </p>
            </div>
          )}

          <div className="mt-4 shrink-0 pt-4 sm:mt-6 sm:pt-6">
            <MessageInput onSend={handleSendMessage} onStartVoice={() => {}} />
          </div>

          <p className="mt-3 shrink-0 pb-8 text-center text-xs text-gray-500 sm:mt-4 md:pb-0">
            MeiChat can make mistakes. Verify important information.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
