import { useState } from 'react'
import { X } from 'lucide-react'
import TextField from '../../../form/TextField'
import Checkbox from '../../../form/Checkbox'
import { cn } from '../../../../utils/cn'

const ROWS = [
  ['Share personal or identifiable information', 'restrictPii'],
  ['Share financial information', 'restrictFinancial'],
  ['Share medical information', 'restrictMedical'],
  ['Provide legal advice', 'restrictLegal'],
]

export default function GuardrailsStep({
  guardrailName,
  onGuardrailNameChange,
  restrictPii,
  setRestrictPii,
  restrictFinancial,
  setRestrictFinancial,
  restrictMedical,
  setRestrictMedical,
  restrictLegal,
  setRestrictLegal,
  customRestrictionLines,
  onAddCustomRestriction,
  onRemoveCustomRestriction,
}) {
  const [customDraft, setCustomDraft] = useState('')

  const setters = {
    restrictPii: setRestrictPii,
    restrictFinancial: setRestrictFinancial,
    restrictMedical: setRestrictMedical,
    restrictLegal: setRestrictLegal,
  }
  const values = { restrictPii, restrictFinancial, restrictMedical, restrictLegal }

  const totalRows = ROWS.length + customRestrictionLines.length
  /** Scroll once there are more than six rows — viewport shows ~six items. */
  const scrollable = totalRows > 6

  const handleCustomKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const t = customDraft.trim()
    if (!t) return
    onAddCustomRestriction(t)
    setCustomDraft('')
  }

  return (
    <div className="mx-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Guardrails &amp; Restrictions</h2>
      <p className="mt-1 text-xs text-gray-500">Define how your chatbot should respond to users.</p>

      <div className="mt-4 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-800">
            Guardrail name <span className="text-red-500">*</span>
          </label>
          <TextField
            value={guardrailName}
            onChange={(e) => onGuardrailNameChange(e.target.value)}
            placeholder="e.g. Customer Support Restrictions"
          />
          <p className="mt-1 text-xs text-gray-500">No special characters; 3–20 characters long.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Restrictions</p>
          <div
            className={cn(
              scrollable &&
                'max-h-[min(10.5rem,50vh)] overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable]'
            )}
          >
            <ul className="space-y-2">
              {ROWS.map(([label, key]) => (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <Checkbox checked={values[key]} onChange={(e) => setters[key](e.target.checked)} />
                    {label}
                  </label>
                </li>
              ))}
              {customRestrictionLines.map((text, idx) => (
                <li key={`custom-${idx}`}>
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                      <Checkbox
                        className="mt-0.5 shrink-0"
                        checked
                        onChange={() => onRemoveCustomRestriction(idx)}
                        aria-label="Remove this custom restriction"
                      />
                      <span className="min-w-0 flex-1 leading-snug">{text}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onRemoveCustomRestriction(idx)}
                      className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Remove restriction"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <TextField
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Describe a custom restriction…"
          />
          <p className="mt-1 text-xs text-gray-400">Press Enter to add to the list above.</p>
        </div>
        <p className="text-xs text-gray-500">At least one restriction is required before continuing.</p>
      </div>
    </div>
  )
}
