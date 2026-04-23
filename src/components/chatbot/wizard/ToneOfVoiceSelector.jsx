import { Smile, Laugh, UserRound, Pencil } from 'lucide-react'

const OPTIONS = [
  { id: 'neutral', label: 'Neutral', Icon: Smile },
  { id: 'friendly', label: 'Friendly', Icon: Laugh },
  { id: 'formal', label: 'Formal', Icon: UserRound },
  { id: 'custom', label: 'Custom', Icon: Pencil },
]

export default function ToneOfVoiceSelector({ value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-gray-800">Tone of Voice</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTIONS.map((opt) => {
          const Icon = opt.Icon
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center text-lg font-medium transition-colors ${
                selected
                  ? 'border-brand-teal bg-white text-black shadow-sm'
                  : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
                <span className="text-xs font-medium">{opt.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
