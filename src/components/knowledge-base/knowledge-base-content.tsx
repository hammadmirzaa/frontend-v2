"use client";

import { AppLayout } from "@/components/layout";
import { Button, COLORS } from "@/components/ui";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import { KnowledgeBaseEmpty } from "./components/knowledge-base-empty";
import { KnowledgeBaseList } from "./components/knowledge-base-list";
import { AddKnowledgeModal } from "./modals/add-knowledge-modal";

export function KnowledgeBaseContent() {
  const { items } = useKnowledgeBase();
  const showEmpty = items.length === 0;

  return (
    <AppLayout title="Knowledge Base">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-gray-200 pb-4 ">
          <div>
            <h2 className="text-xl font-bold text-title">Knowledge Base</h2>
            <p className="mt-1 text-sm text-muted">
              Centralize files and written content used by your chatbot to answer
              user questions.
            </p>
          </div>
          <AddKnowledgeModal>
            <Button
              type="button"
              className="shrink-0 rounded-lg px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.BRAND }}
            >
              Add Knowledge
            </Button>
          </AddKnowledgeModal>
        </div>

        <div className={`rounded-xl ${!showEmpty ? "bg-white" : ""}`}>
          {showEmpty ? (
            <KnowledgeBaseEmpty />
          ) : (
            <KnowledgeBaseList />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
