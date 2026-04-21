"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { useChatbots } from "@/contexts/chatbots-context";
import { EditChatbotHeader } from "./edit-chatbot-header";
import { EditChatbotTabs, type EditChatbotTabId } from "./edit-chatbot-tabs";
import { EditChatbotFooter } from "./edit-chatbot-footer";
import { CustomizationSection, GuardrailsSection, KnowledgeBaseSection } from "./sections";

export function EditChatbotPage() {
  const params = useParams();
  const router = useRouter();
  const { chatbots, updateChatbot } = useChatbots();
  const id = params.id as string;
  const chatbot = chatbots.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<EditChatbotTabId>("customization");

  if (!chatbot) {
    return (
      <AppLayout title="Chatbots">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Chatbot not found.</p>
          <button
            type="button"
            onClick={() => router.push("/chatbots")}
            className="ml-2 text-indigo-600 hover:underline"
          >
            Back to list
          </button>
        </div>
      </AppLayout>
    );
  }

  const handleSave = () => {
    updateChatbot(id, { name: chatbot.name, status: chatbot.status });
    router.push("/chatbots");
  };

  const handleReset = () => {
  };

  return (
    <AppLayout title="Chatbots">
      <div className="mx-auto max-w-7xl space-y-0">
        <EditChatbotHeader chatbot={chatbot} />

        <EditChatbotTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className={`rounded-xl  p-6 ${activeTab === "customization" ? "bg-white border border-gray-200 " : ""}`}>
          {activeTab === "customization" && <CustomizationSection />}
          {activeTab === "guardrails" && <GuardrailsSection />}
          {activeTab === "knowledge-base" && <KnowledgeBaseSection />}
        </div>

       {activeTab === "customization" && (
        <div className="pt-6">
          <EditChatbotFooter onReset={handleReset} onSave={handleSave} />
        </div>
       )}
      </div>
    </AppLayout>
  );
}
