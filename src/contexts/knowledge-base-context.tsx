"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { KnowledgeBaseItem } from "@/components/knowledge-base/types";

type KnowledgeBaseContextValue = {
  items: KnowledgeBaseItem[];
  addItem: (item: Omit<KnowledgeBaseItem, "id" | "lastUpdated">) => KnowledgeBaseItem;
  updateItem: (id: string, data: Partial<KnowledgeBaseItem>) => void;
  removeItem: (id: string) => void;
  getItem: (id: string) => KnowledgeBaseItem | undefined;
};

const KnowledgeBaseContext = createContext<KnowledgeBaseContextValue | null>(null);

function generateId(): string {
  return `kb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatLastUpdated(): string {
  return "2 min ago";
}


export function KnowledgeBaseProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);

  const addItem = useCallback((item: Omit<KnowledgeBaseItem, "id" | "lastUpdated">) => {
    const id = generateId();
    const newItem: KnowledgeBaseItem = {
      ...item,
      id,
      lastUpdated: formatLastUpdated(),
    };
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, data: Partial<KnowledgeBaseItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const getItem = useCallback((id: string) => {
    return items.find((i) => i.id === id);
  }, [items]);

  return (
    <KnowledgeBaseContext.Provider
      value={{ items, addItem, updateItem, removeItem, getItem }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
}

export function useKnowledgeBase() {
  const ctx = useContext(KnowledgeBaseContext);
  if (!ctx) {
    throw new Error("useKnowledgeBase must be used within KnowledgeBaseProvider");
  }
  return ctx;
}
