"use client";

import { Button } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

interface EditChatbotFooterProps {
  onReset: () => void;
  onSave: () => void;
}

export function EditChatbotFooter({ onReset, onSave }: EditChatbotFooterProps) {
  return (
    <div className="flex justify-end gap-3 border-gray-200">
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="rounded-lg"
        style={{ borderColor: COLORS.BRAND, color: COLORS.BRAND }}
      >
        Reset to Defaults
      </Button>
      <Button
        type="button"
        onClick={onSave}
        className="rounded-lg text-white"
        style={{ backgroundColor: COLORS.BRAND }}
      >
        Save Settings
      </Button>
    </div>
  );
}
