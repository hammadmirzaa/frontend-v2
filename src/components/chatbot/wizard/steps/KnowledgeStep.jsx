import { ChevronDown, ChevronUp, Pencil, Upload, File as FileIcon, X } from 'lucide-react'
import TextField from '../../../form/TextField'

export default function KnowledgeStep({
  fileInputRef,
  uploadedFiles,
  onFileInputClick,
  onFilePick,
  onDropZoneDrop,
  onRemoveFile,
  websiteUrl,
  onWebsiteUrlChange,
  manualKbOpen,
  onManualKbToggle,
  manualKbText,
  onManualKbTextChange,
}) {
  return (
    <div className="mx-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
      <p className="mt-1 text-xs text-gray-500">Teach the chatbot what it knows.</p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-800">Add Website URL</label>
          <TextField
            type="url"
            inputMode="url"
            autoComplete="url"
            value={websiteUrl}
            onChange={(e) => onWebsiteUrlChange(e.target.value)}
            placeholder="www.example.com"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">Upload file</p>
          <button
            type="button"
            onClick={onFileInputClick}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={onDropZoneDrop}
            className="flex w-full flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-gray-200 px-6 py-10 text-center transition-colors hover:border-brand-teal/40 hover:bg-brand-teal/[0.03]"
          >
            <img src="/svgs/chatbot/upload.svg" alt="Upload" className="w-15 h-15" />
            <span className="text-base font-semibold text-black mt-2">Click here to upload or drag your file here</span>
            <span className="mt-1 text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, TXT</span>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt" onChange={onFilePick} />

          {uploadedFiles.length > 0 && (
            <ul className="mt-3 space-y-2">
              {uploadedFiles.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 text-gray-800">
                    <img src="/svgs/chatbot/doc.svg" alt="File" className="w-4 h-4 shrink-0" />
                    <span className="truncate">{u.file.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(u.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={onManualKbToggle}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-4">
              <img src="/svgs/chatbot/write-manually.svg" alt="Write manually" className="w-10 h-10" />
              <span>
                <span className="block text-base font-semibold text-gray-900">Write manually</span>
                <span className="text-xs text-gray-500">Manually write your own specific knowledge.</span>
              </span>
            </span>
            {manualKbOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>
          {manualKbOpen && (
            <div className="border-t border-gray-200 px-4 pb-4 pt-4">
              <TextField
                multiline
                rows={6}
                value={manualKbText}
                onChange={(e) => onManualKbTextChange(e.target.value)}
                placeholder="Write your knowledge here... You can include FAQs, product information, company policies, or any information you want your chatbot to know about."
              />
              <p className="mt-1 text-xs text-gray-400">{manualKbText.length} characters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
