import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Details",
  description: "View and manage lead details",
};

export default function LeadDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
