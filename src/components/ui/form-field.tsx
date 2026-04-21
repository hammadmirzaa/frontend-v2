"use client";

import { cn } from "@/lib/utils";
import { Label } from "./typography";

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  helperText,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} required={required} className="block text-sm font-bold text-gray-900">
        {label}
      </Label>

      {children}
      {helperText && (
        <p className="text-xs text-gray-400">{helperText}</p>
      )}
            {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
}
