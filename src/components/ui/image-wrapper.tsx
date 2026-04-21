"use client";

import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

const imageWrapperVariants = {
  rounded: {
    none: "rounded-none",
    sm: "rounded-sm",
    DEFAULT: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  },
  shadow: {
    none: "shadow-none",
    sm: "shadow-sm",
    DEFAULT: "shadow",
    md: "shadow-md",
    lg: "shadow-lg",
  },
  border: {
    none: "border-0",
    DEFAULT: "border border-secondary-200 dark:border-secondary-700",
    thick: "border-2 border-secondary-300 dark:border-secondary-600",
  },
};

export interface ImageWrapperProps extends Omit<ImageProps, "className"> {
  className?: string;
  rounded?: keyof typeof imageWrapperVariants.rounded;
  shadow?: keyof typeof imageWrapperVariants.shadow;
  bordered?: keyof typeof imageWrapperVariants.border;
}

export function ImageWrapper({
  className,
  rounded = "DEFAULT",
  shadow = "none",
  bordered = "none",
  alt,
  ...props
}: ImageWrapperProps) {
  return (
    <Image
      alt={alt}
      className={cn(
        "object-cover",
        imageWrapperVariants.rounded[rounded],
        imageWrapperVariants.shadow[shadow],
        imageWrapperVariants.border[bordered],
        className
      )}
      {...props}
    />
  );
}
