import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | Meichat",
  description: "Set up your Meichat workspace",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
