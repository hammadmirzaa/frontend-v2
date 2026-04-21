"use client";

import { AppLayout } from "@/components/layout";
import { useLeads } from "@/contexts/leads-context";
import { LeadsEmpty } from "./components/leads-empty";
import { LeadsList } from "./components/leads-list";
import { LeadsStatsCards } from "./components/leads-stats-cards";
import { ScheduledActivitiesSection } from "./components/scheduled-activities-section";
import { shadows } from "@/lib/design-tokens";

export function LeadsContent() {
  const { leads } = useLeads();
  const showList = leads.length > 0;

  return (
    <AppLayout title="Leads" className="bg-page-bg">
      <div className="space-y-6">
        <LeadsStatsCards leads={leads} />

        {showList && <ScheduledActivitiesSection />}

        <div
          className="overflow-hidden rounded-xl bg-white border border-gray-200"
        >
          {showList ? <LeadsList /> : <LeadsEmpty />}
        </div>
      </div>
    </AppLayout>
  );
}
