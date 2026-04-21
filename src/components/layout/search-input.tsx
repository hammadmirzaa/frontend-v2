"use client";

import { ImageWrapper, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function SearchInput({
  placeholder = "Search here...",
  className,
  inputClassName,
  value,
  onChange,
  style,
}: SearchInputProps) {
  return (
    <div className={cn("relative max-w-md", className)}>
      <ImageWrapper src="/svgs/search.svg" alt="Search" width={20} height={20} className="absolute left-3 top-[19px] -translate-y-1/2" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "h-10 rounded-lg border border-input-bg bg-input-bg pl-10 text-sm placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0",
          inputClassName
        )}
        style={style}
      />
    </div>
  );
}
