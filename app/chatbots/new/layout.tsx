import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Chatbot",
  description: "Create a new AI chatbot",
};

export default function NewChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
