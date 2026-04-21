import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guardrails",
  description: "Configure guardrails for your chatbots",
};

export default function GuardrailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
