"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { Button, COLORS } from "@/components/ui";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import { useChatbots } from "@/contexts/chatbots-context";
import { DetailsPanel } from "./details-panel";

export function KnowledgeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getItem, updateItem } = useKnowledgeBase();
  const { chatbots } = useChatbots();
  const item = getItem(id);

  const [title, setTitle] = useState(item?.title ?? "Untitled");

  const chatbotNames = Object.fromEntries(chatbots.map((c) => [c.id, c.name]));

  const handleUpdate = useCallback(
    (data: Parameters<typeof updateItem>[1]) => {
      updateItem(id, data);
    },
    [id, updateItem],
  );

  const handleSaveAndClose = useCallback(() => {
    updateItem(id, { title: title.trim() || "Untitled" });
    router.push("/knowledge-base");
  }, [id, title, updateItem, router]);

  if (!item) {
    return (
      <AppLayout title="Knowledge Base">
        <div className="rounded-lg bg-white p-8 text-center">
          <p className="text-gray-500">Knowledge item not found.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/knowledge-base")}
          >
            Back to Knowledge Base
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Knowledge Base">
      <div className="flex min-h-[calc(100vh-8rem)] flex-col md:flex-row gap-4">
        <div className="flex-1 rounded-lg bg-white">
          <div className="p-6">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              rows={20}
              className="w-full border-0 bg-transparent text-xl placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-none overflow-hidden"
              aria-label="Knowledge title"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between items-center">
          <DetailsPanel
            item={item}
            onUpdate={handleUpdate}
            chatbotNames={chatbotNames}
          />

          <div className="border-t border-gray-200 bg-white px-6 py-4 w-full">
            <Button
              type="button"
              className="rounded-lg px-6 py-2.5 font-medium text-white w-full "
              style={{ backgroundColor: COLORS.BRAND }}
              onClick={handleSaveAndClose}
            >
              Save and Close
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
