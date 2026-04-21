import type { Metadata } from "next";
import { LeadsProvider } from "@/contexts/leads-context";

export const metadata: Metadata = {
  title: "Leads",
  description: "View and manage your leads",
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LeadsProvider>{children}</LeadsProvider>;
}
