import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversation",
  description: "View conversation details",
};

export default function ConversationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
