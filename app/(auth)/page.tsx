"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginPage from "@/components/auth/login";
import type { LoginFormData } from "@/lib/validations/auth";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSignup = searchParams.get("fromSignup") === "1";

  const handleSubmit = (data: LoginFormData) => {
    // TODO: call auth API with data
    if (fromSignup) {
      router.push("/onboarding");
    } else {
      router.push("/playground");
    }
  };

  const handleResetPassword = (data: { email: string }) => {
    console.log("Reset password requested for", data.email);
  };

  return (
    <LoginPage
      registerHref="/register"
      onGoogleSignIn={() => {}}
      onSubmit={handleSubmit}
      onResetPassword={handleResetPassword}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoginPage registerHref="/register" onGoogleSignIn={() => {}} />}>
      <AuthPageContent />
    </Suspense>
  );
}
