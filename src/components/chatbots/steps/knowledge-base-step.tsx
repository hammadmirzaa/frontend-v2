"use client";

import { CardContent, Label, Textarea, ImageWrapper, COLORS } from "@/components/ui";
import type { CreateChatbotFormData } from "../types";
import { StepCardHeader } from "./step-card-header";
import { ChevronIcon } from "./chevron-icon";

type SetFormData = React.Dispatch<React.SetStateAction<CreateChatbotFormData>>;

interface KnowledgeBaseStepProps {
  formData: CreateChatbotFormData;
  setFormData: SetFormData;
}

export function KnowledgeBaseStep({ formData, setFormData }: KnowledgeBaseStepProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [
        ...prev.uploadedFiles,
        ...Array.from(files).map((f, i) => ({
          id: `${Date.now()}-${i}-${f.name}`,
          name: f.name,
        })),
      ],
    }));
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id),
    }));
  };

  return (
    <>
      <StepCardHeader
        title="Knowledge Base"
        description="Teach the chatbot what it knows."
      />
      <CardContent className="space-y-6 pt-0">
        <div className="space-y-2">
          <Label className="block text-sm font-bold text-gray-900">
            Upload File
          </Label>
          <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-1 border-dashed border-gray-200 py-8 transition-colors hover:border-gray-300 hover:bg-gray-50">
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              onChange={handleFileSelect}
            />
            <ImageWrapper src="/svgs/upload.svg" alt="" width={48} height={48} />
            <span className="mt-3 text-sm font-bold text-gray-700">
              Click here to upload or drag your file here
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Supported formats: PDF, DOC, DOCX, TXT
            </span>
          </label>
          {formData.uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 w-full">
              {formData.uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className=" w-full flex justify-between items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                >
                  <div className="flex items-center gap-2" >
                  <ImageWrapper src="/svgs/doc.svg" alt="" width={16} height={16} className="" />
                  <span>{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="ml-1 rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Remove file"
                  >
                    <span className="inline-block h-4 w-4">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({ ...prev, writeManuallyExpanded: !prev.writeManuallyExpanded }))
            }
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3 py-2">
              <ImageWrapper src="/svgs/writeManually.svg" alt="" width={40} height={40} />
              <div>
                <span className="text-medium font-bold text-gray-900">Write manually</span>
                <p className="text-xs text-gray-500">
                  Manually write your own specific knowledge.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-gray-400 cursor-pointer">
              <ChevronIcon direction={formData.writeManuallyExpanded ? "up" : "down"} />
            </span>
          </button>
          {formData.writeManuallyExpanded && (
            <div className="border-t border-gray-200 px-4 pb-4 pt-4">
              <Textarea
                placeholder="Write your knowledge here... You can include FAQs, product information, company policies, or any information you want your chatbot to know about."
                value={formData.manualKnowledge}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manualKnowledge: e.target.value }))
                }
                rows={6}
                className="min-h-[180px] resize-y rounded-lg border-gray-50  placeholder:text-gray-400"
                style={{
                  backgroundColor: COLORS.INPUT_BG,
                }}
              />
              <p className="mt-2 text-xs text-gray-400">
                {formData.manualKnowledge.length} characters
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}
