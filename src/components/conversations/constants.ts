import type { ConversationMessage } from "@/components/chat";

export type ConversationListItem = {
  id: string;
  title: string;
  chatbotName: string;
  messageCount: number;
  username: string;
  timestamp: string;
};
export type ChatbotListItem = { id: string; name: string; createdAt: string };
export const MOCK_CHATBOTS: ChatbotListItem[] = [
  { id: "1", name: "Chatbot Name", createdAt: "24-12-2025" },
  { id: "2", name: "Support Bot", createdAt: "20-12-2025" },
  { id: "3", name: "Sales Bot", createdAt: "15-12-2025" },
  { id: "4", name: "FAQ Bot", createdAt: "10-12-2025" },
];

export const MOCK_CONVERSATIONS: Record<string, ConversationListItem[]> = {
  "1": [
    { id: "c1", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "2 sec ago" },
    { id: "c2", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "1 hr ago" },
    { id: "c3", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "Yesterday" },
    { id: "c4", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "Last Month" },
    { id: "c5", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "Last Month" },
    { id: "c6", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "Last Month" },
    { id: "c7", title: "Premium Plan Inquiry", chatbotName: "Chatbot Name", messageCount: 2, username: "Username", timestamp: "Last Month" },
  ],
  "2": [],
  "3": [],
  "4": [],
};

export function getConversationById(id: string): ConversationListItem | undefined {
  for (const list of Object.values(MOCK_CONVERSATIONS)) {
    const found = list.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Mock transcript messages for conversation detail view (keyed by conversation id). */
export const MOCK_CONVERSATION_MESSAGES: Record<string, ConversationMessage[]> = {
  c1: [
    { from: "agent", name: "Chatbot Name", time: "15:18", body: "Hello! I'm your voice assistant. How can I help you today?" },
    { from: "user", name: "Username", time: "15:19", body: "Can you help me understand how voice mode works?" },
    { from: "agent", name: "Chatbot Name", time: "15:21", body: "Of course! Voice mode allows you to have a natural conversation with me using your voice. Simply speak, and I'll transcribe and respond to your questions in real-time. You can see our conversation in text form on the left side of the screen." },
  ],
  c2: [
    { from: "agent", name: "Chatbot Name", time: "14:00", body: "Hi! How can I assist you?" },
    { from: "user", name: "Username", time: "14:01", body: "I have a question about the premium plan." },
  ],
};

const DEFAULT_MESSAGES: ConversationMessage[] = [
  { from: "agent", name: "Chatbot Name", time: "15:18", body: "Hello! I'm your voice assistant. How can I help you today?" },
  { from: "user", name: "Username", time: "15:19", body: "Can you help me understand how voice mode works?" },
  { from: "agent", name: "Chatbot Name", time: "15:21", body: "Of course! Voice mode allows you to have a natural conversation with me using your voice." },
];

export function getMessagesForConversation(id: string): ConversationMessage[] {
  return MOCK_CONVERSATION_MESSAGES[id] ?? DEFAULT_MESSAGES;
}


