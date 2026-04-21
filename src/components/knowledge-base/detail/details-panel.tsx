"use client";

import { Select, ImageWrapper } from "@/components/ui";
import type { KnowledgeBaseItem } from "../types";

export interface DetailsPanelProps {
  item: KnowledgeBaseItem;
  onUpdate: (data: Partial<KnowledgeBaseItem>) => void;
  chatbotNames: Record<string, string>;
}

export function DetailsPanel({
  item,
  onUpdate,
  chatbotNames,
}: DetailsPanelProps) {
  const sourceLabel = item.sourceType === "manual" ? "Manual" : "Upload";

  return (
    <aside className="w-full h-[90%] shrink-0  rounded-lg bg-white md:w-80">
      <div className="sticky top-4 space-y-6 p-6">
        <h3 className="text-base font-bold text-gray-900">Details</h3>

        <div className="space-y-4">
        <div className="flex flex-col gap-3 border-y border-gray-200 py-4" >  
          <div className="flex items-center justify-between" >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Data source
            </p>
            <div className=" flex items-center gap-2">
              <ImageWrapper
                src="/svgs/document-text.svg"
                alt=""
                width={16}
                height={16}
                className="text-gray-500"
              />
              <span className="text-sm font-medium text-gray-900 capitalize">
                {sourceLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between" >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last updated
            </p>
            <div className=" flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-gray-400" aria-hidden title="Last updated">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">{item.lastUpdated}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4" >  
          <div className="flex items-center justify-between" >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Linked Chatbots
            </p>
            <div className=" flex flex-wrap gap-2">
              {item.linkedChatbotIds.length > 0 ? (
                item.linkedChatbotIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {chatbotNames[id] ?? "Chatbot"}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4" >    
          <div className="flex items-center justify-between" >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Language
            </p>
            <div className=" ">
              <Select
                value={item.language}
                onChange={(e) => onUpdate({ language: e.target.value })}
                className="h-10 w-full rounded-lg border-gray-200 bg-white"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </div>
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
}
