"use client";

import { cn } from "@/lib/utils";
import { ImageWrapper } from "../ui";
import Image from "next/image";

/** 2x2 grid logo placeholder – replace with your Meichat logo SVG */
export function LogoBrand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/svgs/logo.svg" alt="Meichat" width={24} height={24} />
      <span className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
        Meichat
      </span>
    </div>
  );
}
