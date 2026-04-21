"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-20 w-20 text-xl",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof avatarSizes;
  src?: string | null;
  alt?: string;
  fallback?: string;
}

export function Avatar({
  size = "md",
  src,
  alt = "",
  fallback,
  className,
  ...props
}: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(" ")
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-secondary-200 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300",
        avatarSizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 40px, 48px"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-medium">
          {initials}
        </span>
      )}
    </div>
  );
}
