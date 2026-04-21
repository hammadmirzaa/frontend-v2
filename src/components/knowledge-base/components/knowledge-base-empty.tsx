"use client";

import { EmptyState, ImageWrapper } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

function KnowledgeBaseEmptyIcon() {
  return (
    <ImageWrapper src="/svgs/info.svg" alt="Knowledge Base Empty" width={64} height={64} />
  );
}

export interface KnowledgeBaseEmptyProps {
  className?: string;
}

export function KnowledgeBaseEmpty({ className }: KnowledgeBaseEmptyProps) {
  return (
    <div className={`flex min-h-[76vh] w-full ${className ?? ""}`}>
      <EmptyState
        icon={<KnowledgeBaseEmptyIcon />}
        title="No Knowledge Base yet!"
        description="Add Knowledge base by uploading a document or by writing manually"
        className="flex-1"
      />
    </div>
  );
}
