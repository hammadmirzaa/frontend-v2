"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { AuthForm, FormField, PasswordInput, AUTH_PAGE_STYLES } from "./";

export interface RegisterPageProps {
  signInHref?: string;
  termsHref?: string;
  onGoogleSignIn?: () => void;
  onSubmit?: (data: RegisterFormData) => void;
}

export default function RegisterPage({
  signInHref = "/",
  termsHref = "#",
  onGoogleSignIn,
  onSubmit,
}: RegisterPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <AuthForm
      title="Create new account"
      subtext={
        <>
          Already have an account?&nbsp;
          <Link href={signInHref} className={AUTH_PAGE_STYLES.link}>
            Sign in here
          </Link>
        </>
      }
      onGoogleSignIn={onGoogleSignIn}
    >
      <form onSubmit={handleSubmit((data: RegisterFormData) => onSubmit?.(data))} className="space-y-5" noValidate>
        <FormField
          id="register-name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Enter your Name"
          {...register("name")}
          error={errors.name?.message}
        />

        <FormField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your Email"
          {...register("email")}
          error={errors.email?.message}
        />

        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          placeholder="Enter your Password"
          {...register("password")}
          error={errors.password?.message}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className={AUTH_PAGE_STYLES.primaryButton}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthForm>
  );
}
