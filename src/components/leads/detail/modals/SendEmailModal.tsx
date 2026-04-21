"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Bold, Italic, Underline, Paperclip, ImageIcon, Smile } from "lucide-react";
import { ModalContent, useModalContext, FormField, Input, ModalFooter, Button } from "@/components/ui";
import { LeadModalHeader } from "./LeadModalShell";
import { SEND_EMAIL } from "./constants";
import { COLORS } from "@/lib/design-tokens";
import { EnvelopeIcon } from "../components/icons";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function SendEmailModalContent() {
  const { close } = useModalContext();
  const [to, setTo] = useState<string>(SEND_EMAIL.TO_DEFAULT);
  const [subject, setSubject] = useState("");
  const [messageEmpty, setMessageEmpty] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState<{ id: number; name: string; size: number }[]>([]);
  const nextId = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const newFiles = Array.from(fileList).map((f) => ({ id: nextId.current++, name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function doFormat(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    setMessageEmpty(!editorRef.current?.innerText?.trim());
  }

  function doInsert(text: string) {
    editorRef.current?.focus();
    // document.execCommand("insertText", false, text);
    setMessageEmpty(false);
    setShowEmoji(false);
  }

  return (
    <ModalContent className="max-w-md rounded-xl" style={{ borderColor: COLORS.CARD_BORDER }}>
      <LeadModalHeader title={SEND_EMAIL.TITLE} subtitle={SEND_EMAIL.SUBTITLE} dividerColor="#E9EAEB" />
      <div className="px-6 py-4 space-y-4">
        <FormField id="email-to" label={SEND_EMAIL.TO_LABEL}>
          <div className="relative flex items-center">
            <EnvelopeIcon className="absolute left-3 h-4 w-4 text-gray-600" />
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 rounded-lg border w-full pl-10"
              style={{ borderColor: COLORS.CARD_BORDER }}
            />
          </div>
        </FormField>

        <FormField id="email-subject" label={SEND_EMAIL.SUBJECT_LABEL} required>
          <Input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={SEND_EMAIL.SUBJECT_PLACEHOLDER}
            className="h-11 rounded-lg border w-full"
            style={{ borderColor: COLORS.CARD_BORDER }}
          />
        </FormField>

        <FormField id="email-message" label={SEND_EMAIL.MESSAGE_LABEL}>
          <div className="rounded-lg border overflow-visible" style={{ borderColor: COLORS.CARD_BORDER }}>
            <div className="relative min-h-[140px]">
              <div
                ref={editorRef}
                contentEditable
                onInput={() => setMessageEmpty(!editorRef.current?.innerText?.trim())}
                className="min-h-[140px] w-full px-3 py-3 text-sm outline-none"
                style={{ color: COLORS.TEXT_BODY }}
                
              />
              {messageEmpty && (
                <span className="absolute left-3 top-3 text-sm pointer-events-none text-gray-400">
                  {SEND_EMAIL.MESSAGE_PLACEHOLDER}
                </span>
              )}
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t px-2 py-2" style={{ borderColor: COLORS.CARD_BORDER_LIGHT }}>
                {files.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-sm text-gray-700">
                    <span className="truncate max-w-[140px]" title={f.name}>{f.name}</span>
                    <span className="text-gray-500 text-xs shrink-0">{formatSize(f.size)}</span>
                    <button type="button" onClick={() => removeFile(f.id)} className="shrink-0 rounded p-0.5 hover:bg-gray-200 text-gray-600" aria-label="Remove">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative flex items-center gap-0 border-t py-2 px-2" style={{ borderColor: COLORS.CARD_BORDER_LIGHT }}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("bold")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Bold">
                <Bold className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("italic")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Italic">
                <Italic className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => doFormat("underline")} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Underline">
                <Underline className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-0.5" />
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => {
                const list = e.target.files;
                if (list?.length) {
                  addFiles(list);
                  doInsert(Array.from(list).map((f) => `[Attachment: ${f.name}]`).join(" ") + " ");
                }
                e.target.value = "";
              }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Attachment">
                <Paperclip className="h-4 w-4" strokeWidth={2} />
              </button>
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file?.type.startsWith("image/")) return;
                addFiles(e.target.files!);
                const reader = new FileReader();
                reader.onload = () => doInsert(`<img src="${reader.result}" alt="" style="max-width:100%;height:auto;" />`);
                reader.readAsDataURL(file);
                e.target.value = "";
              }} />
              <button type="button" onClick={() => imageRef.current?.click()} className="p-1.5 rounded hover:bg-gray-100 text-gray-700" aria-label="Image">
                <ImageIcon className="h-4 w-4" strokeWidth={2} />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-0.5" />
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`p-1.5 rounded hover:bg-gray-100 text-gray-700 ${showEmoji ? "bg-purple-50 border border-purple-200" : ""}`}
                aria-label="Emoji"
              >
                <Smile className="h-4 w-4" strokeWidth={2} />
              </button>
              {showEmoji && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 rounded-lg border border-gray-200 shadow-lg bg-white">
                  <EmojiPicker onEmojiClick={(e) => doInsert(e.emoji)} width={300} height={360} previewConfig={{ showPreview: false }} />
                </div>
              )}
            </div>
          </div>
        </FormField>
      </div>

      <ModalFooter className="flex flex-row justify-between w-full gap-2 border-t px-6 py-4" style={{ borderColor: COLORS.CARD_BORDER }}>
        <Button type="button" variant="outline" className="rounded-lg" style={{ backgroundColor: COLORS.GRAY_100, borderColor: "transparent", color: COLORS.BRAND_TITLE }} onClick={close}>
          {SEND_EMAIL.CANCEL}
        </Button>
        <div className="flex flex-row justify-between gap-2" >
        <Button type="button" variant="outline" className="rounded-lg" style={{ backgroundColor: COLORS.WHITE, borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE }} onClick={close}>
          {SEND_EMAIL.SAVE_AS_DRAFT}
        </Button>
        <Button type="button" className="rounded-lg text-white" style={{ backgroundColor: COLORS.BRAND }} onClick={close}>
          {SEND_EMAIL.SUBMIT}
        </Button>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
