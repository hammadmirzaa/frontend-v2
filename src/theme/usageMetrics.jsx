import {
  MessageSquare,
  FileText,
  Mail,
  Smartphone,
  HardDrive,
  BarChart3,
} from 'lucide-react'

/**
 * Single source of truth for billable / subscription usage metrics:
 * icon, gradients, soft tiles, and progress bars. Import from here only —
 * do not duplicate per page.
 */
export const USAGE_METRIC_IDS = {
  AI_QUERIES: 'ai_queries',
  DOCUMENTS: 'documents',
  EMAILS: 'emails',
  SMS: 'sms',
  STORAGE: 'storage',
}

/** BASIC plan dashboard row order (field names on `basicUsage`). */
export const USAGE_METRIC_BASIC_ROWS = [
  { id: 'ai_queries', usedField: 'ai_queries_used', cardLabel: 'AI queries used' },
  { id: 'documents', usedField: 'documents_used', cardLabel: 'Documents used' },
  { id: 'emails', usedField: 'emails_used', cardLabel: 'Emails used' },
  { id: 'sms', usedField: 'sms_used', cardLabel: 'SMS used' },
  { id: 'storage', usedField: 'storage_used', cardLabel: 'Storage used' },
]

const THEMES = {
  ai_queries: {
    id: 'ai_queries',
    label: 'AI queries',
    Icon: MessageSquare,
    gradientAccent: 'from-violet-500 to-purple-800',
    iconSoftWrap: 'bg-violet-100 text-violet-700 ring-violet-200/80',
    progressGradient: 'bg-gradient-to-r from-violet-500 to-indigo-600',
    ring: 'ring-violet-200/50',
  },
  documents: {
    id: 'documents',
    label: 'Documents',
    Icon: FileText,
    gradientAccent: 'from-sky-500 to-blue-800',
    iconSoftWrap: 'bg-sky-100 text-sky-700 ring-sky-200/80',
    progressGradient: 'bg-gradient-to-r from-sky-500 to-cyan-600',
    ring: 'ring-sky-200/50',
  },
  emails: {
    id: 'emails',
    label: 'Emails',
    Icon: Mail,
    gradientAccent: 'from-amber-500 to-orange-800',
    iconSoftWrap: 'bg-amber-100 text-amber-800 ring-amber-200/80',
    progressGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ring: 'ring-amber-200/50',
  },
  sms: {
    id: 'sms',
    label: 'SMS',
    Icon: Smartphone,
    gradientAccent: 'from-emerald-500 to-teal-800',
    iconSoftWrap: 'bg-emerald-100 text-emerald-700 ring-emerald-200/80',
    progressGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200/50',
  },
  storage: {
    id: 'storage',
    label: 'Storage',
    allocationLabel: 'Storage (MB)',
    Icon: HardDrive,
    gradientAccent: 'from-slate-500 to-slate-800',
    iconSoftWrap: 'bg-slate-200/90 text-slate-800 ring-slate-300/80',
    progressGradient: 'bg-gradient-to-r from-slate-500 to-slate-700',
    ring: 'ring-slate-200/50',
  },
}

const DEFAULT_THEME = {
  id: 'unknown',
  label: 'Usage',
  Icon: BarChart3,
  gradientAccent: 'from-indigo-500 to-slate-800',
  iconSoftWrap: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  progressGradient: 'bg-gradient-to-r from-indigo-500 to-slate-700',
  ring: 'ring-slate-200/40',
}

function humanizeKey(raw) {
  return String(raw ?? 'Usage')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Map API / enum / label strings to a canonical metric id, or null if unknown.
 */
export function normalizeUsageMetricKey(raw) {
  const s = String(raw ?? '').trim()
  const k = s.toLowerCase().replace(/\s+/g, '_')
  if (!k) return null
  if (k.includes('storage')) return USAGE_METRIC_IDS.STORAGE
  if (k.includes('document')) return USAGE_METRIC_IDS.DOCUMENTS
  if (k.includes('email')) return USAGE_METRIC_IDS.EMAILS
  if (k.includes('sms')) return USAGE_METRIC_IDS.SMS
  if (k.includes('query') || k === 'ai' || k.includes('ai_query')) return USAGE_METRIC_IDS.AI_QUERIES
  if (THEMES[k]) return k
  return null
}

/** Theme for a canonical id (e.g. `documents`). */
export function getUsageMetricThemeById(id) {
  if (id && THEMES[id]) return THEMES[id]
  return { ...DEFAULT_THEME, id: id || 'unknown', label: humanizeKey(id) }
}

/**
 * Theme for arbitrary backend keys (`ai_queries`, `AI_QUERIES`, `Documents`, …).
 */
export function getUsageMetricTheme(rawKey) {
  const id = normalizeUsageMetricKey(rawKey)
  if (id && THEMES[id]) return THEMES[id]
  return {
    ...DEFAULT_THEME,
    label: humanizeKey(rawKey),
  }
}

/** Format numeric display; storage keeps decimals when small. */
export function formatUsageMetricNumber(value, rawKey) {
  const id = normalizeUsageMetricKey(rawKey)
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  if (id === 'storage') {
    if (Math.abs(n) >= 100 || Number.isInteger(n)) return n.toLocaleString()
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }
  return Math.round(n).toLocaleString()
}

/** For admin modals: gradient tile + icon + label (allocation uses allocationLabel when set). */
export function getUsageAllocationVisual(usageType) {
  const t = getUsageMetricTheme(usageType)
  return {
    Icon: t.Icon,
    accent: t.gradientAccent,
    label: t.allocationLabel || t.label,
  }
}
