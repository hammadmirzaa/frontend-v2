"use client";

import { CardContent, COLORS, ImageWrapper } from "@/components/ui";
import { EmbedCode } from "../embedCode";
import { EMBED_CODE } from "../types";

export function PreviewStep() {
  const copyEmbedCode = () => {
    void navigator.clipboard.writeText(EMBED_CODE);
  };

  return (
    <CardContent className="space-y-8 pt-6">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900">Widget Preview</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-4 text-sm text-gray-500">https://yourwebsite.com</span>
          </div>
          <div className="relative min-h-[320px] p-6">
            <div className="space-y-2">
              <div className="h-3 w-48 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-200" />
              <div className="mt-4 h-3 w-32 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-200" />
            </div>
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
              <div
                className="w-72 overflow-hidden rounded-xl bg-white shadow-lg"
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
              >
                <div
                  className="flex items-center gap-3 rounded-t-xl rounded-b-lg px-4 py-3"
                  style={{ backgroundColor: COLORS.BRAND }}
                >
                  <ImageWrapper src="/svgs/botChat.svg" alt="" width={20} height={20} />
                  <div>
                    <p className="text-sm font-bold text-white">Chat Assistant</p>
                    <p className="text-xs font-normal text-gray-300">Online</p>
                  </div>
                </div>
                <div className="flex justify-center px-4 py-5">
                  <div
                    className="rounded-2xl rounded-tl-md px-4 py-3"
                    style={{ backgroundColor: COLORS.BRAND_TINT }}
                  >
                    <p className="text-sm text-gray-700">
                      Hi! How can I help you today?
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                style={{ backgroundColor: COLORS.BRAND }}
                aria-label="Open chat"
              >
                <ImageWrapper src="/svgs/chat.svg" alt="" width={25} height={25} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <EmbedCode embedCode={EMBED_CODE} copyEmbedCode={copyEmbedCode} />
    </CardContent>
  );
}
