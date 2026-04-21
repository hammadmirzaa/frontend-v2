import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Chatbot",
  description: "Edit your AI chatbot settings",
};

export default function EditChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
