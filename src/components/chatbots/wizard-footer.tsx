"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

interface WizardFooterProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onActivate: () => void;
}

export function WizardFooter({
  step,
  totalSteps,
  onBack,
  onNext,
  onActivate,
}: WizardFooterProps) {
  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
      <div>
        {isFirstStep ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border border-gray-200 bg-gray-100 text-muted hover:bg-gray-100 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-lg border bg-input-bg text-body hover:bg-gray-100 cursor-pointer font-bold"
            style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE, backgroundColor: COLORS.INPUT_BRAND_SELECTED }}
          >
            <ChevronLeft className="h-4 w-4" />
Back
          </Button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        {!isLastStep && (
          <Link
            href="#"
            className="text-sm font-medium text-muted hover:text-title"
            onClick={(e) => e.preventDefault()}
          >
            Skip for now
          </Link>
        )}
        <div>
          {isLastStep ? (
            <Button
              type="button"
              className="rounded-lg text-white cursor-pointer"
              style={{ backgroundColor: COLORS.BRAND }}
              onClick={onActivate}
            >
              Activate Chatbot
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 rounded-lg text-white cursor-pointer"
              style={{ backgroundColor: COLORS.BRAND }}
            >
              Next Step
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
