import type { Metadata } from "next";
import { ChatbotsProvider } from "@/contexts/chatbots-context";

export const metadata: Metadata = {
  title: "Chatbots",
  description: "Create and manage your AI chatbots",
};

export default function ChatbotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatbotsProvider>{children}</ChatbotsProvider>;
}
