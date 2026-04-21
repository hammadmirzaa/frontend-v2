"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ChatbotRow = {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
};

type ChatbotsContextValue = {
  chatbots: ChatbotRow[];
  addChatbot: (chatbot: Omit<ChatbotRow, "id">) => ChatbotRow;
  updateChatbot: (id: string, data: Partial<ChatbotRow>) => void;
  removeChatbot: (id: string) => void;
};

const ChatbotsContext = createContext<ChatbotsContextValue | null>(null);

export function ChatbotsProvider({ children }: { children: ReactNode }) {
  const [chatbots, setChatbots] = useState<ChatbotRow[]>([]);

  const addChatbot = useCallback((chatbot: Omit<ChatbotRow, "id">) => {
    const id = `chatbot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newChatbot: ChatbotRow = { ...chatbot, id };
    setChatbots((prev) => [newChatbot, ...prev]);
    return newChatbot;
  }, []);

  const updateChatbot = useCallback((id: string, data: Partial<ChatbotRow>) => {
    setChatbots((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  }, []);

  const removeChatbot = useCallback((id: string) => {
    setChatbots((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <ChatbotsContext.Provider
      value={{ chatbots, addChatbot, updateChatbot, removeChatbot }}
    >
      {children}
    </ChatbotsContext.Provider>
  );
}

export function useChatbots() {
  const ctx = useContext(ChatbotsContext);
  if (!ctx) {
    throw new Error("useChatbots must be used within ChatbotsProvider");
  }
  return ctx;
}

/** Use when provider is optional (e.g. Conversations page). Returns null when not inside ChatbotsProvider. */
export function useChatbotsOptional(): ChatbotsContextValue | null {
  return useContext(ChatbotsContext);
}
