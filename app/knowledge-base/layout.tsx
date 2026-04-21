import type { Metadata } from "next";
import { ChatbotsProvider } from "@/contexts/chatbots-context";
import { KnowledgeBaseProvider } from "@/contexts/knowledge-base-context";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Manage knowledge base sources for your chatbots",
};

export default function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatbotsProvider>
      <KnowledgeBaseProvider>{children}</KnowledgeBaseProvider>
    </ChatbotsProvider>
  );
}
