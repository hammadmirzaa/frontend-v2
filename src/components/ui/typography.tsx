"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    level: {
      h1: "text-4xl md:text-5xl",
      h2: "text-3xl md:text-4xl",
      h3: "text-2xl md:text-3xl",
      h4: "text-xl md:text-2xl",
      h5: "text-lg md:text-xl",
      h6: "text-base md:text-lg",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    level: "h1",
    weight: "semibold",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading({
  as: Tag = "h1",
  level = "h1",
  weight,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(headingVariants({ level, weight }), className)}
      {...props}
    />
  );
}

const textColorVariants = cva("", {
  variants: {
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary-600",
      secondary: "text-secondary-600",
      success: "text-green-600",
      danger: "text-red-600",
      warning: "text-amber-600",
    },
  },
  defaultVariants: {
    color: "default",
  },
});

export interface ParagraphProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "color">,
    VariantProps<typeof textColorVariants> {}

export function Paragraph({
  color,
  className,
  ...props
}: ParagraphProps) {
  return (
    <p
      className={cn("text-base leading-6", textColorVariants({ color }), className)}
      {...props}
    />
  );
}

export interface SmallProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textColorVariants> {}

export function Small({ color, className, ...props }: SmallProps) {
  return (
    <small
      className={cn(
        "text-sm leading-5",
        textColorVariants({ color }),
        className
      )}
      {...props}
    />
  );
}

export interface LabelProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "color">,
    VariantProps<typeof textColorVariants> {
  required?: boolean;
}

export function Label({
  color,
  required,
  className,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        textColorVariants({ color }),
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof textColorVariants> {
  size?: "xs" | "sm" | "base" | "lg";
}

export function Text({
  color,
  size = "base",
  className,
  ...props
}: TextProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };
  return (
    <span
      className={cn(
        sizeClasses[size],
        textColorVariants({ color }),
        className
      )}
      {...props}
    />
  );
}
