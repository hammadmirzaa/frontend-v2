import { Smile, Laugh, UserRound, Pencil } from 'lucide-react'

const OPTIONS = [
  { id: 'neutral', label: 'Neutral', Icon: "neutral" },
  { id: 'friendly', label: 'Friendly', Icon: "friendly" },
  { id: 'formal', label: 'Formal', Icon: "formal" },
  { id: 'custom', label: 'Custom', Icon: "custom" },
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
                <img src={`/svgs/chatbot/${Icon}.svg`} alt={Icon} className="w-6 h-6" />
                <span className="text-xs font-medium">{opt.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
