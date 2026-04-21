import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversations",
  description: "View and manage your chatbot conversations",
};

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
