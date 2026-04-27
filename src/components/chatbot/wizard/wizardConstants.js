import { FileText, Shield, BookOpen, Eye } from 'lucide-react'

/** labelLines — two lines under each step (matches Create Chatbot stepper design). */
export const STEPS = [
  { id: 'basic', labelLines: ['Basic', 'Information'], Icon: "basicinformation" },
  { id: 'guardrails', labelLines: ['Guardrails &', 'Restrictions'], Icon: "gr" },
  { id: 'knowledge', labelLines: ['Knowledge', 'Base'], Icon: "kb" },
  { id: 'preview', labelLines: ['Preview'], Icon: "preview" },
]

export function mapToneToPersonality(tone) {
  switch (tone) {
    case 'friendly':
      return {
        persona_type: 'friendly',
        tone_config: { emoji_usage: 'moderate', response_length: 'moderate', language_style: 'conversational' },
      }
    case 'formal':
      return {
        persona_type: 'professional',
        tone_config: { emoji_usage: 'none', response_length: 'moderate', language_style: 'formal' },
      }
    case 'custom':
      return {
        persona_type: 'professional',
        tone_config: { emoji_usage: 'minimal', response_length: 'moderate', language_style: 'conversational' },
      }
    default:
      return {
        persona_type: 'professional',
        tone_config: { emoji_usage: 'minimal', response_length: 'moderate', language_style: 'professional' },
      }
  }
}

export function validateChatbotName(name) {
  const s = name.trim()
  if (s.length < 3 || s.length > 40) return 'Use 3-40 characters.'
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\s\-_]*$/.test(s)) return 'Use letters, numbers, spaces, hyphens, or underscores.'
  return null
}

/** Normalize user input for `/api/documents/ingest-url` (requires http/https + host). */
export function normalizeWebsiteUrlForIngest(raw) {
  const t = String(raw || '').trim()
  if (!t) return null
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`
  try {
    const u = new URL(withScheme)
    if (!u.hostname) return null
    return u.href
  } catch {
    return null
  }
}
