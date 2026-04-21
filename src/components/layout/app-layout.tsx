"use client";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

function AppLayoutContent({
  children,
  title,
  className,
}: AppLayoutProps) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "transition-[padding] duration-200",
        "pl-0",
        collapsed ? "md:pl-16" : "md:pl-64",
        className
      )}
    >
      <Navbar title={title} />
      <main className="min-h-[calc(100vh-6rem)] p-4 md:p-5">{children}</main>
    </div>
  );
}

export function AppLayout({ children, title, className }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className={cn("min-h-screen bg-gray-50 w-full", className)}>
        <Sidebar />
        <AppLayoutContent title={title} className={className}>
          {children}
        </AppLayoutContent>
      </div>
    </SidebarProvider>
  );
}
