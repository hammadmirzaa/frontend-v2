/**
 * Knowledge Base feature types
 */

export type KnowledgeSourceType = "manual" | "upload";

export type KnowledgeBaseItem = {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  linkedChatbotIds: string[];
  lastUpdated: string;
  language: string;
  fileName?: string;
  /** Manual entry content when sourceType is "manual" */
  content?: string;
};

export type KnowledgeTabId = "documents" | "manual-responses";
