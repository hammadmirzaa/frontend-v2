"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "./image-wrapper";

export interface WizardStep {
  id: string;
  label: string;
  iconKey: string;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  currentStepIndex: number;
  className?: string;
}

function StepIcon({
  iconKey,
  isActive,
  size = 50,
}: {
  iconKey: string;
  isActive: boolean;
  size?: number;
}) {
  const filename = `${isActive ? "active" : "inactive"}${iconKey}.svg`;
  return (
    <ImageWrapper
      src={`/svgs/${filename}`}
      alt=""
      width={size}
      height={size}
    />
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 sm:h-5 sm:w-5", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function WizardStepper({
  steps,
  currentStepIndex,
  className,
}: WizardStepperProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto overflow-y-hidden py-2",
        className
      )}
    >
      <div className="flex min-w-max items-center justify-center">
        {steps.map((step, i) => {
          const isCompleted = i < currentStepIndex;
          const isActive = i === currentStepIndex;
          const isInactive = i > currentStepIndex;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex shrink-0 items-center">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white sm:h-10 sm:w-10"
                  style={
                    isCompleted || isActive
                      ? { backgroundColor: COLORS.BRAND }
                      :  undefined 
                  }
                >
                  {isCompleted ? (
                    <CheckIcon className="text-white" />
                  ) : (
                    <StepIcon
                      iconKey={step.iconKey}
                      isActive={isActive}
                      size={50}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 max-w-16 text-center text-xs sm:mt-2 sm:max-w-24 sm:text-sm md:max-w-40 lg:max-w-64",
                    isActive && "font-bold text-brand-title",
                    isCompleted && "font-bold text-brand-title",
                    isInactive && "font-medium text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="mx-1.5 h-0.5 w-6 shrink-0 sm:mx-3 sm:w-12 md:mx-4 md:w-40"
                  style={{
                    backgroundColor: isCompleted
                      ? COLORS.BRAND
                      : COLORS.BORDER_INACTIVE,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
