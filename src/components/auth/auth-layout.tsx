"use client";

import { cn } from "@/lib/utils";
import { AuthFooter } from "./auth-footer";
import { COLORS } from "@/lib/design-tokens";

const AUTH_PAGE_STYLES = {
  background:
    "min-h-screen flex flex-col items-center justify-between px-4 py-10 sm:py-14",
  card:
    "w-full max-w-[500px] max-h-[597.47px] rounded-2xl border border-solid border-white bg-white shadow-lg shadow-gray-100/50",
  link:
    "font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded underline",
  primaryButton:
    "w-full py-[18px] mt-2 rounded-lg bg-[var(--auth-primary)] hover:bg-violet-700 text-white font-medium text-[16px] focus-visible:ring-violet-500 ",
  outlineButton:
    "w-full h-10 rounded-lg bg-white border border-gray-100 shadow-xs text-gray-800 font-medium hover:bg-gray-50 focus-visible:ring-gray-400  ",
  input:
    "h-11 w-full rounded-lg border border-gray-50 bg-input-bg px-3 py-2 text-sm text-title placeholder:text-[var(--auth-subtext)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:border-transparent",
  label: "block text-sm font-normal text-black mb-0.5",
  subtext: "text-[var(--auth-subtext)]",
} as const;

export { AUTH_PAGE_STYLES };

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <main
      className={cn(AUTH_PAGE_STYLES.background, className)}
      style={{
        backgroundImage: `url('/png/primaryBg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        ["--auth-primary" as string]: COLORS.BRAND,
        ["--auth-subtext" as string]: COLORS.SUBTEXT,
      }}
    >
      {children}
      <AuthFooter />
    </main>
  );
}