"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ONBOARDING } from "@/lib/design-tokens";
import { Card, CardHeader, CardContent } from "@/components/ui";

export interface OnboardingCardProps {
  children: ReactNode;
  step2?: boolean; // step 2 uses off-white card bg
  step3?: boolean; // step 3 uses larger dimensions (580px × 751px)
  step4?: boolean; // step 4 uses larger dimensions (540px × 751px)
  className?: string;
}

export function OnboardingCard({
  children,
  step2 = false,
  step3 = false,
  step4 = false,
  className,
}: OnboardingCardProps) {
  const sizeClass =  "max-w-[540px] max-h-[780px]"

  return (
    <Card
      className={cn(
        "w-full overflow-auto rounded-2xl border border-gray-50",
        sizeClass,
        className
      )}
      style={{
        backgroundColor: ONBOARDING.CARD_WHITE,
      }}
    >
      {children}
    </Card>
  );
}

export function OnboardingCardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <CardHeader className={cn("space-y-4 pb-2 text-center px-6  pt-10", className)}>
      {children}
    </CardHeader>
  );
}

export function OnboardingCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <CardContent className={cn("px-6 pb-10 pt-0 space-y-6", className)}>
      {children}
    </CardContent>
  );
}
