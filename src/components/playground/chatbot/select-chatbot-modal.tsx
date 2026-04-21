"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ModalRoot,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalClose,
  Button,
  COLORS,
  useModalContext,
} from "@/components/ui";
import { SearchInput } from "@/components/layout/search-input";
import { ChatbotCard } from "./chatbot-card";

const SORT_OPTIONS = [
  { value: "Sort by", label: "Sort by" },
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
] as const;

function SortByDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Date";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 min-w-28 items-center justify-between rounded-lg border bg-white px-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200"
        style={{ borderColor: COLORS.GRAY_200, color: COLORS.TEXT_TITLE }}
      >
        <span>{currentLabel}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 opacity-70"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-lg border bg-white py-1 shadow-lg"
          style={{ borderColor: COLORS.GRAY_200 }}
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                style={{
                  backgroundColor: isSelected ? COLORS.BRAND_ACTIVE_BG : undefined,
                  color: isSelected ? COLORS.BRAND_TITLE : COLORS.TEXT_TITLE,
                  fontWeight: isSelected ? 600 : undefined,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpenChatbotButton({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect?: (chatbotId: string) => void;
}) {
  const { close } = useModalContext();
  const handleClick = () => {
    if (selectedId) {
      onSelect?.(selectedId);
      close();
    }
  };
  return (
    <Button
      type="button"
      onClick={handleClick}
      className="w-full rounded-lg font-medium text-white"
      style={{ backgroundColor: COLORS.BRAND }}
    >
      Open Chatbot
    </Button>
  );
}

const PLACEHOLDER_CHATBOTS = [
  { id: "1", name: "Chatbot Name", date: "24-12-2025" },
  { id: "2", name: "Chatbot Name", date: "24-12-2025" },
  { id: "3", name: "Chatbot Name", date: "24-12-2025" },
  { id: "4", name: "Chatbot Name", date: "24-12-2025" },
  { id: "5", name: "Chatbot Name", date: "24-12-2025" },
  { id: "6", name: "Chatbot Name", date: "24-12-2025" },
];

export interface SelectChatbotModalProps {
  children: React.ReactNode;
  /** Currently selected chatbot id (e.g. from parent). When modal opens, this one is shown as selected. */
  selectedChatbotId?: string | null;
  onSelect?: (chatbotId: string) => void;
}

export function SelectChatbotModal({
  children,
  selectedChatbotId,
  onSelect,
}: SelectChatbotModalProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Sort by");
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedChatbotId ?? PLACEHOLDER_CHATBOTS[0]?.id ?? null
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setSelectedId(selectedChatbotId ?? PLACEHOLDER_CHATBOTS[0]?.id ?? null);
      }
    },
    [selectedChatbotId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PLACEHOLDER_CHATBOTS;
    return PLACEHOLDER_CHATBOTS.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <ModalRoot onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border-gray-200 p-0 sm:mx-4">
        <ModalHeader className="mb-0 flex shrink-0 flex-row items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-semibold text-gray-700 m-0 truncate pr-2">
            Select a Chatbot
          </h2>
          <ModalClose
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </ModalClose>
        </ModalHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
          <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative min-w-0 flex-1">
              <SearchInput
                placeholder="Search chatbots..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-none"
                inputClassName="border-gray-50 placeholder:text-gray-500"
                style={{
                  backgroundColor: COLORS.INPUT_BG,
                }}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:w-auto">
              <SortByDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((chatbot) => (
              <ChatbotCard
                key={chatbot.id}
                name={chatbot.name}
                date={chatbot.date}
                selected={selectedId === chatbot.id}
                onClick={() => setSelectedId(chatbot.id)}
              />
            ))}
            </div>
          </div>
        </div>

        <ModalFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4 w-full">
          <ModalClose
            className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-bold transition-colors hover:bg-gray-50"
            style={{
              borderColor: COLORS.BRAND_BORDER,
              color: COLORS.BRAND_TITLE,
            }}
          >
            Cancel
          </ModalClose>
          <OpenChatbotButton
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
}
