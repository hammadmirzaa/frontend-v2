"use client";

import { Button } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

export function GuardrailsSection() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-bold text-gray-900">
        Your chatbot&apos;s Guardrails are not configured.
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Guardrails define the boundaries of what your bot can and cannot say,
        ensuring safe, compliant, and brand-aligned interactions.
      </p>
      <Button
        type="button"
        className="mt-6 rounded-lg text-white"
        style={{ backgroundColor: COLORS.BRAND }}
      >
        Setup Now
      </Button>
    </div>
  );
}
