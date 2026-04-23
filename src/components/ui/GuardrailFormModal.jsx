import { useEffect, useState } from 'react'
import Modal from '../Modal'
import TextField from '../form/TextField'
import Checkbox from '../form/Checkbox'
import { Button } from './Button'
import { SelectDropdown } from './SelectDropdown'
import { COLORS } from '../../lib/designTokens'
import { X } from 'lucide-react'

const RESTRICTIONS = [
  { id: 'restrictPii', label: 'Share personal or identifiable information' },
  { id: 'restrictFinancial', label: 'Share financial information' },
  { id: 'restrictMedical', label: 'Share medical information' },
  { id: 'restrictLegal', label: 'Provide legal advice' },
]

const parseCustomRestrictions = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

export function GuardrailFormModal({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  mode = 'create',
  form,
  onChange,
  description,
  onDescriptionChange,
  chatbotId,
  onChatbotChange,
  chatbotOptions = [],
  allowedTopics = [],
  deniedTopics = [],
  topicInput = { allowed: '', denied: '' },
  onTopicInputChange,
  onAddTopic,
  onRemoveTopic,
}) {
  const title = mode === 'edit' ? 'Edit Guardrail' : 'Create a Guardrail'
  const submitText = mode === 'edit' ? 'Save Guardrail' : 'Create Guardrail'
  const [customRestrictionDraft, setCustomRestrictionDraft] = useState('')
  const [customRestrictions, setCustomRestrictions] = useState([])

  useEffect(() => {
    if (!isOpen) return
    setCustomRestrictions(parseCustomRestrictions(form.customRestriction))
    setCustomRestrictionDraft('')
  }, [isOpen, form.customRestriction])

  const syncCustomRestrictions = (next) => {
    setCustomRestrictions(next)
    onChange('customRestriction', next.join('\n'))
  }

  const addCustomRestriction = () => {
    const value = customRestrictionDraft.trim()
    if (!value) return
    if (customRestrictions.includes(value)) {
      setCustomRestrictionDraft('')
      return
    }
    syncCustomRestrictions([...customRestrictions, value])
    setCustomRestrictionDraft('')
  }

  const removeCustomRestriction = (value) => {
    syncCustomRestrictions(customRestrictions.filter((item) => item !== value))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Define rules that limit or guide how the chatbot responds."
      panelClassName="max-h-[85vh] max-w-2xl overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">Name*</label>
          <TextField
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. Customer Support Restrictions"
          />
          <p className="mt-2 text-xs text-gray-500">A short, descriptive name for this guardrail.</p>
        </div>

        {typeof onDescriptionChange === 'function' ? (
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">Description</label>
            <TextField
              multiline
              rows={3}
              value={description || ''}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe the purpose of this guardrail..."
            />
          </div>
        ) : null}

        <SelectDropdown
          label="Apply to"
          value={form.applyTo}
          onChange={(value) => onChange('applyTo', value)}
          options={[
            { value: 'all', label: 'All chatbots' },
            { value: 'linked', label: 'Linked chatbot only' },
          ]}
          helperText="Choose where this guardrail will be enforced."
        />

        {Array.isArray(chatbotOptions) && chatbotOptions.length > 0 && typeof onChatbotChange === 'function' ? (
          <SelectDropdown
            label="Linked Chatbot (Optional)"
            value={chatbotId || ''}
            onChange={onChatbotChange}
            options={[
              { value: '', label: 'Global (All Chatbots)' },
              ...chatbotOptions.map((chatbot) => ({ value: chatbot.id, label: chatbot.name })),
            ]}
            helperText="Select a chatbot to scope this guardrail, or keep global."
          />
        ) : null}

        {/* {typeof onAddTopic === 'function' && typeof onRemoveTopic === 'function' && typeof onTopicInputChange === 'function' ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Allowed Topics</label>
              <div className="mb-2 flex items-center gap-2">
                <TextField
                  value={topicInput.allowed || ''}
                  onChange={(e) => onTopicInputChange('allowed', e.target.value)}
                  placeholder="Add allowed topic..."
                />
                <Button type="button" variant="outline" className="px-4 py-2 text-xs" onClick={() => onAddTopic('allowed')}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allowedTopics.map((topic) => (
                  <span key={`allowed-${topic}`} className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800">
                    {topic}
                    <button type="button" className="ml-1.5 text-green-700" onClick={() => onRemoveTopic('allowed', topic)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Denied Topics</label>
              <div className="mb-2 flex items-center gap-2">
                <TextField
                  value={topicInput.denied || ''}
                  onChange={(e) => onTopicInputChange('denied', e.target.value)}
                  placeholder="Add denied topic..."
                />
                <Button type="button" variant="outline" className="px-4 py-2 text-xs" onClick={() => onAddTopic('denied')}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {deniedTopics.map((topic) => (
                  <span key={`denied-${topic}`} className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-800">
                    {topic}
                    <button type="button" className="ml-1.5 text-red-700" onClick={() => onRemoveTopic('denied', topic)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null} */}

        <div>
          <p className="mb-2 text-sm font-bold text-gray-900">Restrictions</p>
          <p className="mb-3 text-xs text-gray-500">Select what the chatbot must not do.</p>
          <div className="space-y-2.5">
            {RESTRICTIONS.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox checked={Boolean(form[item.id])} onChange={(e) => onChange(item.id, e.target.checked)} />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <TextField
              value={customRestrictionDraft}
              onChange={(e) => setCustomRestrictionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomRestriction()
                }
              }}
              placeholder="Describe a custom restriction..."
            />
            <Button type="button" variant="outline" className="px-4 py-2 text-xs" onClick={addCustomRestriction}>
              Add
            </Button>
          </div>
          <div className={`mt-3 space-y-2 ${customRestrictions.length > 4 ? 'max-h-36 overflow-y-auto pr-1' : ''}`}>
            {customRestrictions.map((restriction) => (
              <div
                key={restriction}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              >
                <span className="pr-2">{restriction}</span>
                <button
                  type="button"
                  className="text-gray-500 transition-colors hover:text-gray-700"
                  onClick={() => removeCustomRestriction(restriction)}
                  aria-label={`Remove ${restriction}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">At least one restriction is required.</p>
        </div>

        <SelectDropdown
          label="Status"
          value={form.status}
          onChange={(value) => onChange('status', value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          helperText="Guardrails only apply when active."
        />
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white pt-4">
          <Button type="button" variant="outline" onClick={onClose} className='w-full !py-2.5' >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            disabled={submitting}
            style={{ backgroundColor: COLORS.BRAND }}
            className='w-full !py-2.5'
          >
            {submitting ? 'Saving...' : submitText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
