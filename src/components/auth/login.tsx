"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  loginSchema,
  resetPasswordSchema,
  type LoginFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import {
  AuthForm,
  FormField,
  PasswordInput,
  AuthCheckbox,
  AUTH_PAGE_STYLES,
} from "./";

export interface LoginPageProps {
  registerHref?: string;
  onGoogleSignIn?: () => void;
  onSubmit?: (data: LoginFormData) => void;
  onResetPassword?: (data: ResetPasswordFormData) => void;
}

export default function LoginPage({
  registerHref = "/register",
  onGoogleSignIn,
  onSubmit,
  onResetPassword,
}: LoginPageProps) {
  const [showResetForm, setShowResetForm] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  if (showResetForm) {
    return (
      <AuthForm
        title="Reset password"
        subtext={
          <>
            Remember your password?&nbsp;
            <button
              type="button"
              onClick={() => setShowResetForm(false)}
              className={AUTH_PAGE_STYLES.link}
            >
              Sign in here
            </button>
          </>
        }
      >
        <form
          onSubmit={resetForm.handleSubmit((data) => {
            onResetPassword?.(data);
            resetForm.reset();
          })}
          className="space-y-5"
          noValidate
        >
          <FormField
            id="reset-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Enter your Email"
            {...resetForm.register("email")}
            error={resetForm.formState.errors.email?.message}
          />

          <Button
            type="submit"
            disabled={resetForm.formState.isSubmitting}
            className={cn(AUTH_PAGE_STYLES.primaryButton, "cursor-pointer")}
          >
            <span className="cursor-pointer">
              {resetForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
            </span>
          </Button>
        </form>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Welcome back"
      subtext={
        <>
          Don&apos;t have an account yet?&nbsp;
          <Link href={registerHref} className={AUTH_PAGE_STYLES.link}>
            Register here
          </Link>
        </>
      }
      onGoogleSignIn={onGoogleSignIn}
    >
      <form
        onSubmit={loginForm.handleSubmit((data) => onSubmit?.(data))}
        className="space-y-5"
        noValidate
      >
        <FormField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your Email"
          {...loginForm.register("email")}
          error={loginForm.formState.errors.email?.message}
        />

        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="Enter your Password"
          {...loginForm.register("password")}
          error={loginForm.formState.errors.password?.message}
        />

        <AuthCheckbox id="login-remember" {...loginForm.register("rememberMe")}>
          Remember me
        </AuthCheckbox>

        <Button
          type="submit"
          disabled={loginForm.formState.isSubmitting}
          className={cn(AUTH_PAGE_STYLES.primaryButton, "cursor-pointer")}
        >
          <span className="cursor-pointer">
            {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </span>
        </Button>

        <p className={cn("text-center text-sm", AUTH_PAGE_STYLES.subtext)}>
          Don&apos;t remember your password?&nbsp;
          <button
            type="button"
            onClick={() => setShowResetForm(true)}
            className={AUTH_PAGE_STYLES.link}
          >
            Reset here
          </button>
        </p>
      </form>
    </AuthForm>
  );
}
