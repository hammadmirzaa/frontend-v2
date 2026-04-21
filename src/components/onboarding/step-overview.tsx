"use client";

import { OnboardingStepShell } from "./onboarding-step-shell";
import { OnboardingStepActions } from "./onboarding-step-actions";
import { OverviewFeatureCard } from "./overview-feature-card";
import { COLORS } from "@/lib/design-tokens";
import { Bot, TrendingUp, Calendar } from "lucide-react";
import { ImageWrapper } from "../ui";

const TITLE = "Quick Product Overview";
const DESCRIPTION = "Here's how Meichat works";

const FEATURES = [
  {
    icon: <ImageWrapper src="/svgs/chatbot.svg" alt="Chatbot" width={34} height={34} />,
    title: "AI chatbots that turn visitors into leads",
    description:
      "Every conversation on your site is captured, identified, and converted into a lead automatically.",
  },
  {
    icon: <ImageWrapper src="/svgs/trending-up.svg" alt="Trending Up" width={34} height={34} />,
    title: "Automatic lead qualification, powered by AI",
    description:
      "Intent, engagement, and context are analyzed in real time, no manual sorting required.",
  },
  {
    icon: <ImageWrapper src="/svgs/calendar.svg" alt="Calendar" width={34} height={34} />,
    title: "Follow-ups that actually convert",
    description:
      "Schedule or automate follow-ups across email, SMS, or calls, at the right time, every time.",
  },
];

export interface StepOverviewProps {
  onGetStarted: () => void;
}

export function StepOverview({ onGetStarted }: StepOverviewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGetStarted();
  };

  return (
    <OnboardingStepShell
      title={TITLE}
      description={DESCRIPTION}
      activeStep={4}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OverviewFeatureCard
          icon={FEATURES[0].icon}
          title={FEATURES[0].title}
          description={FEATURES[0].description}
        />
        <OverviewFeatureCard
          icon={FEATURES[1].icon}
          title={FEATURES[1].title}
          description={FEATURES[1].description}
        />
      </div>
      <OverviewFeatureCard
        icon={FEATURES[2].icon}
        title={FEATURES[2].title}
        description={FEATURES[2].description}
        className="sm:col-span-2"
      />

      <OnboardingStepActions
        primaryLabel="Get Started"
        showSkip={false}
      />
    </OnboardingStepShell>
  );
}
