"use client";

import React from "react";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "../ui";

interface EmbedCodeProps {
  embedCode: string;
  copyEmbedCode: () => void;
  description?: string;
}

export function EmbedCode({ embedCode, copyEmbedCode, description }: EmbedCodeProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-title">Embed Code</h2>

      <div
        className="relative rounded-lg border border-gray-50  p-4"
        style={{
          backgroundColor: COLORS.INPUT_BG,
        }}
      >
        <pre className="overflow-x-auto pr-96 text-sm text-body whitespace-pre-wrap">
          <code>{embedCode}</code>
        </pre>

        <button
          type="button"
          onClick={copyEmbedCode}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-brand-active transition-colors hover:opacity-90"
          aria-label="Copy embed code"
        >
          <ImageWrapper src="/svgs/copy.svg" alt="copy" width={60} height={60} />
        </button>
      </div>

      <p className="text-sm text-muted">
        {description ??
          "Use this embed code to integrate the chatbot into your website and start engaging visitors instantly."}
      </p>
    </div>
  );
}