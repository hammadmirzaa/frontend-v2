"use client";

import { ReactNode, forwardRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Checkbox,
  ErrorMessage,
} from "@/components/ui";
import { AuthLayout, AUTH_PAGE_STYLES } from "./auth-layout";
import { LogoBrand } from "./logo-brand";
import { GoogleIcon } from "./google-icon";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";


interface AuthFormProps {
  title: string;
  subtext?: ReactNode;
  onGoogleSignIn?: () => void;
  children: ReactNode;
}

export function AuthForm({ title, subtext, onGoogleSignIn, children }: AuthFormProps) {
  return (
    <AuthLayout>
      <header className="mb-10 flex justify-center sm:mb-10">
        <LogoBrand />
      </header>

      <Card className={AUTH_PAGE_STYLES.card}>
        <CardHeader className="space-y-4 pb-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtext && <p className="text-sm text-gray-900">{subtext}</p>}
        </CardHeader>

        <CardContent className="space-y-5 pt-3 pb-8">
          {onGoogleSignIn && (
            <Button
              type="button"
              variant="outline"
              className={AUTH_PAGE_STYLES.outlineButton}
              onClick={onGoogleSignIn}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          )}

          {children}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2 pt-5">
        <label htmlFor={id} className={AUTH_PAGE_STYLES.label}>
          {label}
        </label>
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          className={cn(AUTH_PAGE_STYLES.input, error && "border-red-500 focus:ring-red-500", className)}
          {...props}
        />
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ id, label = "Password", error, className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-2">
        <label htmlFor={id} className={AUTH_PAGE_STYLES.label}>
          {label}
        </label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={show ? "text" : "password"}
            aria-invalid={!!error}
            className={cn(AUTH_PAGE_STYLES.input, "pr-11", error && "border-red-500 focus:ring-red-500", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none cursor-pointer"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export interface AuthCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  children?: ReactNode;
  error?: string;
}

export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  ({ id, children, error, className, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            ref={ref}
            aria-invalid={!!error}
            className="h-4 w-4 rounded-sm border-gray-400 text-violet-600 focus:ring-0 cursor-pointer"
            {...props}
          />
          {children && (
            <label htmlFor={id} className="cursor-pointer text-sm font-normal text-black">
              {children}
            </label>
          )}
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }
);
AuthCheckbox.displayName = "AuthCheckbox";
