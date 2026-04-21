import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Meichat",
  description: "Sign in to your Meichat account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
