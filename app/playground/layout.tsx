import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description: "Test and try your chatbots in the Meichat playground",
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
