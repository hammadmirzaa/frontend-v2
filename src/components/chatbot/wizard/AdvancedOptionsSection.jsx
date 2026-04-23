import { ChevronDown, ChevronUp } from 'lucide-react'
import TextField from '../../form/TextField'
import ToneOfVoiceSelector from './ToneOfVoiceSelector'
import { SelectDropdown } from '../../ui'

const SYSTEM_INSTRUCTIONS_FOOTER =
  'Write your guidance here, focusing on role tasks to auto-handle. You can add Zia guidance or in the preview without writing an existing AI.'

export default function AdvancedOptionsSection({
  open,
  onToggle,
  widgetTitle,
  onWidgetTitleChange,
  initialMessage,
  onInitialMessageChange,
  tone,
  onToneChange,
  templates,
  selectedTemplate,
  onTemplateChange,
  systemInstructions,
  onSystemInstructionsChange,
}) {
  const templateOptions = [
    { value: '', label: '-- Select a template --' },
    ...Object.keys(templates || {})
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
      value: name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
  ]

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 pb-3 text-xs font-bold text-brand-teal hover:text-brand-teal-hover"
      >
        {open ? 'Hide Advanced Options' : 'Show Advanced Options'}
        {open ? <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2.5} /> : <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
      </button>

      {open && (
        <div className="flex overflow-hidden  border-l-2 border-[#059A9F33]">
          <div className="min-w-0 flex-1 space-y-5 px-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-800">Widget Title</label>
              <TextField
                value={widgetTitle}
                onChange={(e) => onWidgetTitleChange(e.target.value)}
                placeholder="Chat Assistant"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-800">Initial Message</label>
              <TextField
                multiline
                rows={3}
                value={initialMessage}
                onChange={(e) => onInitialMessageChange(e.target.value)}
                placeholder="Hi! How can I help you today?"
              />
            </div>
            <ToneOfVoiceSelector value={tone} onChange={onToneChange} />
            <div>
              <SelectDropdown
                label="Select a Template"
                value={selectedTemplate}
                onChange={onTemplateChange}
                options={templateOptions}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-800">System Instructions</label>
              <TextField
                multiline
                rows={5}
                value={systemInstructions}
                onChange={(e) => onSystemInstructionsChange(e.target.value)}
                placeholder="Customize how your chatbot behaves. You can write your own instructions."
              />
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{SYSTEM_INSTRUCTIONS_FOOTER}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
