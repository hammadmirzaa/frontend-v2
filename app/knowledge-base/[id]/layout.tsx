import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "View knowledge base details",
};

export default function KnowledgeBaseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
