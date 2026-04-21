"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  priority: "low" | "medium" | "high";
  lastActivity: string;
  source: string;
  createdAt: string;
};

const INITIAL_LEADS: LeadRow[] = [
  {
    id: "lead-dummy-1",
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Tech Innovators Inc.",
    status: "new",
    priority: "low",
    lastActivity: "24-12-2025",
    source: "Chatbot",
    createdAt: "2025-12-24",
  },
  {
    id: "lead-dummy-2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    company: "Global Solutions",
    status: "contacted",
    priority: "medium",
    lastActivity: "24-12-2025",
    source: "Website",
    createdAt: "2025-12-24",
  },
  {
    id: "lead-dummy-3",
    name: "Alice Brown",
    email: "alice.brown@example.com",
    company: "Creative Minds",
    status: "qualified",
    priority: "high",
    lastActivity: "24-12-2025",
    source: "Chatbot",
    createdAt: "2025-12-24",
  },
];

type LeadsContextValue = {
  leads: LeadRow[];
  getLead: (id: string) => LeadRow | undefined;
  addLead: (lead: Omit<LeadRow, "id">) => LeadRow;
  updateLead: (id: string, data: Partial<LeadRow>) => void;
  removeLead: (id: string) => void;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<LeadRow[]>(INITIAL_LEADS);

  const addLead = useCallback((lead: Omit<LeadRow, "id">) => {
    const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newLead: LeadRow = {
      ...lead,
      priority: lead.priority ?? "medium",
      lastActivity: lead.lastActivity ?? new Date().toISOString().slice(0, 10),
      id,
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  }, []);

  const updateLead = useCallback((id: string, data: Partial<LeadRow>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...data } : l))
    );
  }, []);

  const removeLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  return (
    <LeadsContext.Provider
      value={{ leads, getLead, addLead, updateLead, removeLead }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error("useLeads must be used within LeadsProvider");
  }
  return ctx;
}
