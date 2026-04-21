import { COLORS } from "@/lib/design-tokens";
import type { LeadRow } from "@/contexts/leads-context";

/** Pill styles for lead status (shared by list and detail) */
export const STATUS_PILL: Record<LeadRow["status"], { bg: string; text: string }> = {
  new: { bg: "#DCFCE7", text: "#166534" },
  contacted: { bg: "#DBEAFE", text: "#1d4ed8" },
  qualified: { bg: "#FEF3C7", text: "#b45309" },
  won: { bg: "#DCFCE7", text: "#166534" },
  lost: { bg: "#FEE2E2", text: "#b91c1c" },
};

/** Pill styles for lead priority (shared by list and detail) */
export const PRIORITY_PILL: Record<LeadRow["priority"], { bg: string; text: string }> = {
  low: { bg: COLORS.GRAY_200, text: COLORS.GRAY_700 },
  medium: { bg: "#FEF3C7", text: "#b45309" },
  high: { bg: "#FEE2E2", text: "#b91c1c" },
};

export const LEAD_AVATAR_BG = "#F8F7FF";
