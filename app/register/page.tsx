"use client";

import { useRouter } from "next/navigation";
import RegisterPage from "@/components/auth/register";
import type { RegisterFormData } from "@/lib/validations/auth";

export default function RegisterRoute() {
  const router = useRouter();

  const handleSubmit = (data: RegisterFormData) => {
    // TODO: call signup API with data
    router.push("/?fromSignup=1");
  };

  return (
    <RegisterPage
      signInHref="/"
      termsHref="/terms"
      onGoogleSignIn={() => {}}
      onSubmit={handleSubmit}
    />
  );
}
