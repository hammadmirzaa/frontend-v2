"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ONBOARDING } from "@/lib/design-tokens";
import { LogoBrand } from "@/components/auth/logo-brand";

export interface OnboardingLayoutProps {
  children: ReactNode;
  className?: string;
}

export function OnboardingLayout({ children, className }: OnboardingLayoutProps) {
  return (
    <div
      className={cn("min-h-screen flex flex-col", className)}
      style={{
        colorScheme: "light",
        backgroundImage: `url('/png/primaryBg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <LogoBrand className="mb-6 shrink-0" />
        {children}
      </div>
      <footer className="py-6 text-center text-xs" style={{ color: ONBOARDING.TEXT_FOOTER }}>
        ©2026 Meichat - All Rights Reserved.
      </footer>
    </div>
  );
}
