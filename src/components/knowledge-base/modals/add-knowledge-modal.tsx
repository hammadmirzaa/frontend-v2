"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Select,
  FormField,
  ModalRoot,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalClose,
  useModalContext,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import { useChatbots } from "@/contexts/chatbots-context";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import type { KnowledgeSourceType } from "../types";
import { cn } from "@/lib/utils";

type Step = "choose" | "upload";

const MODAL_TITLE = "Add Knowledge";
const MODAL_SUBTITLE = "Choose how you want to provide knowledge.";
const FILE_ACCEPT = ".pdf,.doc,.docx,.txt";
const FILE_FORMATS = "PDF, DOC, DOCX, TXT";

const METHOD_OPTIONS: {
  value: KnowledgeSourceType;
  icon: string;
  title: string;
  description: string;
}[] = [
  { value: "manual", icon: "/svgs/write.svg", title: "Write manually", description: "Manually write your own specific knowledge." },
  { value: "upload", icon: "/svgs/upload2.svg", title: "Upload a Document", description: "Train your chatbot using your documents." },
];

const BTN_PRIMARY = { backgroundColor: COLORS.BRAND };

function buildPayload(selectedChatbotId: string) {
  return {
    linkedChatbotIds: selectedChatbotId ? [selectedChatbotId] : [],
    language: "en-US" as const,
  };
}

export interface AddKnowledgeModalProps {
  children: React.ReactNode;
}

function ModalStepHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between border-b border-gray-200 p-4", className)}>
      <ModalHeader className="mb-0 p-0">
        <h2 className="text-medium font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </ModalHeader>
      <ModalClose
        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close"
      >
        <span className="inline-block h-5 w-5">×</span>
      </ModalClose>
    </div>
  );
}

function ModalActions({
  cancelLabel,
  primaryLabel,
  onCancel,
  onPrimary,
  primaryDisabled = false,
}: {
  cancelLabel: string;
  primaryLabel: string;
  onCancel: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
}) {
  return (
    <ModalFooter className="mt-2 flex w-full gap-2 border-t border-gray-200 p-4 pt-6">
      <Button type="button" variant="outline" className="w-full rounded-lg"  onClick={onCancel} style={{ fontWeight: "bold", color: COLORS.BRAND_TITLE, borderColor: COLORS.BRAND_BORDER }}>
        {cancelLabel}
      </Button>
      <Button type="button" className="w-full rounded-lg text-white" style={BTN_PRIMARY} onClick={onPrimary} 
      >
        {primaryLabel}
      </Button>
    </ModalFooter>
  );
}

function FileDropZone({
  file,
  onFileChange,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <FormField id="select-file-kb" label="Select File">
      <label
        htmlFor="file-upload-kb"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
          dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 hover:bg-gray-100"
        )}
      >
        <ImageWrapper src="/svgs/upload3.svg" alt="" width={64} height={64} className="shrink-0 opacity-70" />
        <span className="text-center text-sm font-bold text-gray-900">
          Click here to upload or drag your file here
        </span>
        <span className="text-xs text-gray-500">Supported formats: {FILE_FORMATS}</span>
        {file && <span className="text-xs font-medium text-indigo-600">{file.name}</span>}
        <input
          id="file-upload-kb"
          type="file"
          accept={FILE_ACCEPT}
          className="sr-only"
          onChange={onFileChange}
        />
      </label>
    </FormField>
  );
}

function AddKnowledgeModalBody() {
  const { close } = useModalContext();
  const router = useRouter();
  const { chatbots } = useChatbots();
  const { addItem } = useKnowledgeBase();
  const [step, setStep] = useState<Step>("choose");
  const [selectedChatbotId, setSelectedChatbotId] = useState("");
  const [method, setMethod] = useState<KnowledgeSourceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const canGoNext = selectedChatbotId.trim() !== "" && method !== null;

  const onNext = useCallback(() => {
    if (method === "upload") {
      setStep("upload");
      return;
    }
    if (method === "manual") {
      const item = addItem({
        title: "Untitled",
        sourceType: "manual",
        ...buildPayload(selectedChatbotId),
      });
      close();
      router.push(`/knowledge-base/${item.id}`);
    }
  }, [method, selectedChatbotId, addItem, close, router]);

  const onUploadSubmit = useCallback(() => {
    if (!file) return;
    addItem({
      title: file.name,
      sourceType: "upload",
      ...buildPayload(selectedChatbotId),
      fileName: file.name,
    });
    close();
  }, [file, selectedChatbotId, addItem, close]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  // Step 2: Upload file
  if (step === "upload") {
    return (
      <>
        <ModalStepHeader title={MODAL_TITLE} subtitle={MODAL_SUBTITLE} className="border-b border-gray-200" />
        <div className="space-y-4 p-4">
          <FileDropZone
            file={file}
            onFileChange={onFileChange}
            dragOver={dragOver}
            onDragOver={onDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          />
        </div>
        <ModalActions
          cancelLabel="Cancel"
          primaryLabel="Upload Knowledge"
          onCancel={close}
          onPrimary={onUploadSubmit}
          primaryDisabled={!file}
        />
      </>
    );
  }

  // Step 1: Choose chatbot and method
  return (
    <>
      <ModalStepHeader title={MODAL_TITLE} subtitle={MODAL_SUBTITLE} />
      <div className="space-y-4 p-4">
        <FormField
          id="kb-select-chatbot"
          label="Select Chatbots"
          required
          helperText="This document will be added to the selected chatbot's knowledge base"
        >
          <Select
            id="kb-select-chatbot"
            value={selectedChatbotId}
            onChange={(e) => setSelectedChatbotId(e.target.value)}
            className="h-10 rounded-lg border-gray-200 bg-white"
          >
            <option value="">Choose a Chatbot</option>
            {chatbots.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          {METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className="flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-colors"
              style={
                method === opt.value
                  ? { borderColor: COLORS.BRAND }
                  : { borderColor: COLORS.GRAY_200, backgroundColor: COLORS.WHITE }
              }
            >
              <ImageWrapper src={opt.icon} alt="" width={40} height={40} />
              <div>
                <p className="font-bold text-gray-900">{opt.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <ModalActions
        cancelLabel="Cancel"
        primaryLabel="Next"
        onCancel={close}
        onPrimary={onNext}
        primaryDisabled={!canGoNext}
      />
    </>
  );
}

export function AddKnowledgeModal({ children }: AddKnowledgeModalProps) {
  return (
    <ModalRoot>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent className="max-w-lg" knowledgeBase>
        <AddKnowledgeModalBody />
      </ModalContent>
    </ModalRoot>
  );
}
