"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";
import { shadows } from "@/lib/design-tokens";
import { useLeads } from "@/contexts/leads-context";
import {
  LeadDetailHeader,
  LeadDetailOverview,
  LeadDetailTimeline,
  LeadDetailChatbot,
  LeadDetailSidebar,
} from "./components";

export function LeadDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getLead, removeLead } = useLeads();
  const lead = getLead(id);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "chatbot">("overview");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "calls" | "emails" | "meetings" | "notes">("all");

  if (!lead) {
    return (
      <AppLayout title="Leads" className="bg-page-bg">
        <div className="rounded-xl bg-white p-8 text-center" style={{ boxShadow: shadows.md }}>
          <p style={{ color: COLORS.TEXT_MUTED }}>Lead not found.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => router.push("/leads")}>
            Back to Leads 
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Leads" className="bg-page-bg">
      <div className="space-y-6">
          <LeadDetailHeader lead={lead} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-6">
            {activeTab === "overview" && <LeadDetailOverview lead={lead} />}
            {activeTab === "timeline" && <LeadDetailTimeline timelineFilter={timelineFilter} setTimelineFilter={setTimelineFilter} />}
            {activeTab === "chatbot" && <LeadDetailChatbot />}
          </div>
          {activeTab === "overview" && <LeadDetailSidebar lead={lead} removeLead={removeLead} />}
        </div>
      </div>
    </AppLayout>
  );
}
