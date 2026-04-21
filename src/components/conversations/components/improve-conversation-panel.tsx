"use client";

import { useState } from "react";
import { COLORS, Button, Textarea, zIndex } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ImproveConversationPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (feedback: string) => void;
}

const FEEDBACK_PLACEHOLDER =
  "Example: The chatbot should have asked about budget before suggesting pricing plans. The tone was too casual for a B2B conversation.";

export function ImproveConversationPanel({
  open,
  onClose,
  onSubmit,
}: ImproveConversationPanelProps) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    onSubmit?.(feedback);
    setFeedback("");
    onClose();
  };

  const handleClose = () => {
    setFeedback("");
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 bg-black/30"
        style={{ zIndex: zIndex.dropdown + 10 }}
        onClick={handleClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 w-full max-w-md overflow-y-auto bg-white shadow-xl",
          "flex flex-col p-6"
        )}
        style={{ zIndex: zIndex.dropdown + 11 }}
        aria-labelledby="improve-conversation-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="improve-conversation-title"
              className="text-lg font-bold"
              style={{ color: COLORS.TEXT_TITLE }}
            >
              Improve Conversation Quality
            </h2>
            <p className="mt-1 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
              Your feedback will be reviewed to improve future conversations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            aria-label="Close panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="mt-6 rounded-xl px-4 py-3"
          style={{ backgroundColor: COLORS.BRAND_ACTIVE_BG }}
        >
          <p className="text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>
            Was the response inaccurate, incomplete, off-tone, or missing a next step?
          </p>
          <p className="mt-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            Mention where the chatbot struggled and what it should have done instead.
          </p>
        </div>

        <div className="mt-6 flex-1">
          <label
            htmlFor="improve-feedback"
            className="block text-sm font-medium"
            style={{ color: COLORS.TEXT_TITLE }}
          >
            Your Feedback
          </label>
          <Textarea
            id="improve-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={FEEDBACK_PLACEHOLDER}
            className="mt-2 min-h-[120px] resize-y"
            style={{ borderColor: COLORS.CARD_BORDER }}
          />
          <p className="mt-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            This feedback will be saved and used to improve future responses for similar conversations.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            style={{ backgroundColor: COLORS.BRAND }}
          >
            Submit Review
          </Button>
        </div>
      </aside>
    </>
  );
}
