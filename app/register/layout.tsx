import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account | Meichat",
  description: "Create your Meichat account",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
