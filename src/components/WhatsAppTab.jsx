import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import config from '../config'
import { cn } from '../utils/cn'
import { Button, SelectDropdown } from './ui'
import Modal from './Modal'
import Spinner from './Spinner'
import {
  Save,
  RefreshCcw,
  Info,
  ShieldAlert,
  Check,
  ChevronDown,
  ChevronRight,
  Bot,
  Wifi,
  WifiOff,
} from 'lucide-react'

const API_URL = config.API_URL

const OPTION_TYPES = [
  { value: 'static', label: 'Static', hint: 'Fixed Reply Fast' },
  { value: 'dynamic', label: 'Dynamic', hint: 'Resolved Per Request' },
  { value: 'agent', label: 'Agent', hint: 'Handoff to AI Agent' },
]

const modalInputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/15'

const ONBOARDING_STEPS = [
  { id: 'not_started', label: 'Not Connected' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready', label: 'Connected' },
  { id: 'rejected', label: 'Rejected' },
]

function WhatsAppGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function optionTypeChip(type) {
  switch (type) {
    case 'static':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
    case 'agent':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-100'
    case 'dynamic':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
    default:
      return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
  }
}

function optionTypeShortLabel(type) {
  const t = OPTION_TYPES.find((x) => x.value === type)
  return t ? t.label : type
}

function optionSubtitle(opt) {
  if (opt.type === 'static' && opt.payload?.text) return String(opt.payload.text)
  if (opt.type === 'agent') return ''
  if (opt.type === 'dynamic') return 'Resolved per request'
  return ''
}

function SettingsCard({ title, description, headerRight, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      {children}
    </div>
  )
}

function CheckmarkRadioRow({
  label,
  hint,
  selected,
  onSelect,
  accent = 'indigo',
  softSurface = false,
  selectedMark = null,
}) {
  const brand = accent === 'brand'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-stretch justify-between gap-2 rounded-lg px-4 py-5 text-left transition sm:min-h-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
        softSurface
          ? selected
            ? brand
              ? 'border border-brand-teal  shadow-sm ring-1 ring-brand-teal/15'
              : 'border-0 bg-indigo-50 shadow-sm'
            : 'border bg-gray-50 hover:bg-gray-100/85'
          : selected
            ? brand
              ? 'border border-brand-teal  shadow-sm ring-1 ring-brand-teal/15'
              : 'border border-indigo-500 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-500/15'
            : 'border border-gray-200 bg-gray-50/80 hover:border-gray-300'
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-normal text-gray-900">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{hint}</span> : null}
      </span>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-lg transition-colors sm:self-auto',
          // selected
          //   ? brand
          //     ? 'border-brand-teal bg-brand-teal text-white'
          //     : 'border-indigo-600 bg-indigo-600 text-white'
          //   : 'border-gray-300 bg-white text-transparent'
        )}
        aria-hidden
      >
        {selected ? (
          selectedMark != null ? (
            <span className="flex h-full w-full items-center justify-center">
              {selectedMark}
            </span>
          ) : (
            <img src="/svgs/whatsapp/check.svg" alt="Check" className="h-4 w-4 object-contain" />
          )
        ) : null}
      </span>
    </button>
  )
}

function TypePicker({ value, onChange, accentBrand = false }) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Option type">
      <p className="text-xs text-gray-500">Selected type shows a checkmark.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTION_TYPES.map((t) => (
          <CheckmarkRadioRow
            key={t.value}
            label={t.label}
            hint={t.hint}
            selected={value === t.value}
            accent={accentBrand ? 'brand' : 'indigo'}
            onSelect={() => onChange(t.value)}
          />
        ))}
      </div>
    </div>
  )
}

export default function WhatsAppTab() {
  const { user } = useAuth()
  const isSuperUser = user?.role === 'SUPER_USER' || user?.is_super_user
  const defaultTenantId = user?.tenant_id || ''

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState(defaultTenantId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ivr, setIvr] = useState({
    active: true,
    welcome_text: 'Welcome! Reply with a number.',
    help_text: 'Please reply with one of the listed options. Send MENU to go back.',
    session_ttl_minutes: 15,
    options: [
      { key: '1', label: 'Company Info', type: 'static', payload: { text: 'We are open 9a-6p, Mon-Sat.' } },
      { key: '0', label: 'Talk to AI', type: 'agent' },
    ],
  })
  const [status, setStatus] = useState({})
  const [error, setError] = useState(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [chatbots, setChatbots] = useState([])
  const [selectedChatbotId, setSelectedChatbotId] = useState('')
  const [bindingChatbot, setBindingChatbot] = useState(false)
  const [addOptionModalOpen, setAddOptionModalOpen] = useState(false)
  const [optionDraft, setOptionDraft] = useState({
    key: '',
    label: '',
    type: 'static',
    staticText: '',
  })
  const [menuOptionsExpanded, setMenuOptionsExpanded] = useState(true)
  const [editOptionIndex, setEditOptionIndex] = useState(null)
  const [editOptionDraft, setEditOptionDraft] = useState(null)

  useEffect(() => {
    if (isSuperUser) {
      fetchTenants()
    }
  }, [isSuperUser])

  useEffect(() => {
    if (!tenantId) return
    fetchIvr()
    fetchStatus()
    fetchChatbots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    if (status?.ai_chatbot_id) {
      setSelectedChatbotId(status.ai_chatbot_id)
    }
  }, [status?.ai_chatbot_id])

  const fetchIvr = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_URL}/api/tenants/${tenantId}/whatsapp/ivr`)
      const data = res.data || {}
      const rawOpts = Array.isArray(data.options) ? data.options : ivr.options
      const normalizedOpts = rawOpts.map((o) => {
        if (o.type !== 'dynamic') return o
        return { ...o, payload: { mode: 'agent' } }
      })
      setIvr({
        active: Boolean(data.active),
        welcome_text: data.welcome_text || ivr.welcome_text,
        help_text: data.help_text || ivr.help_text,
        session_ttl_minutes: parseInt(data.session_ttl_minutes || '15') || 15,
        options: normalizedOpts,
      })
    } catch (e) {
      if (e?.response?.status !== 404) {
        setError(e?.response?.data?.detail || e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    if (!tenantId) return
    try {
      const res = await axios.get(`${API_URL}/api/tenants/${tenantId}/whatsapp/status`)
      setStatus(res.data || {})
    } catch {
      // silent
    }
  }

  const fetchChatbots = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(res.data || [])
    } catch {
      setChatbots([])
    }
  }

  const fetchTenants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tenants/`, { params: { page: 1, page_size: 100 } })
      const items = res.data?.items || []
      setTenants(items)
      if (!tenantId && items.length > 0) setTenantId(items[0].id)
    } catch {
      setTenants([])
    }
  }

  const acceptDisclaimer = async () => {
    setAccepting(true)
    try {
      await axios.post(`${API_URL}/api/tenants/${tenantId}/whatsapp/disclaimer/accept`)
      await fetchStatus()
      setShowDisclaimer(false)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setAccepting(false)
    }
  }

  const bindChatbot = async (id) => {
    const cid = id || selectedChatbotId
    if (!cid) return
    setBindingChatbot(true)
    setError(null)
    try {
      await axios.post(`${API_URL}/api/tenants/${tenantId}/whatsapp/channel/bind`, {
        ai_chatbot_id: cid,
      })
      await fetchStatus()
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setBindingChatbot(false)
    }
  }

  const startOnboarding = async () => {
    setError(null)
    try {
      if (!status.disclaimer_accepted) {
        setShowDisclaimer(true)
        return
      }
      const res = await axios.post(`${API_URL}/api/tenants/${tenantId}/whatsapp/onboarding/start`)
      const { onboarding_url } = res.data || {}
      if (onboarding_url) window.open(onboarding_url, '_blank', 'noopener')
      await fetchStatus()
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    }
  }

  const saveIvr = async () => {
    setSaving(true)
    setError(null)
    try {
      const optionsForSave = ivr.options.map((o) => {
        if (o.type !== 'dynamic') return o
        return { ...o, payload: { mode: 'agent' } }
      })
      const body = {
        active: ivr.active,
        welcome_text: ivr.welcome_text,
        help_text: ivr.help_text,
        session_ttl_minutes: ivr.session_ttl_minutes,
        options: optionsForSave,
      }
      await axios.post(`${API_URL}/api/tenants/${tenantId}/whatsapp/ivr`, body)
      await fetchIvr()
      await fetchStatus()
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setSaving(false)
    }
  }

  const openAddOptionModal = () => {
    setEditOptionIndex(null)
    setEditOptionDraft(null)
    setOptionDraft({ key: '', label: '', type: 'static', staticText: '' })
    setAddOptionModalOpen(true)
  }

  const submitAddOption = () => {
    const k = optionDraft.key.trim()
    const lab = optionDraft.label.trim()
    if (!k || !lab) {
      setError('Key and label are required for a new menu option.')
      return
    }
    const opt = { key: k, label: lab, type: optionDraft.type }
    if (optionDraft.type === 'static') {
      opt.payload = { text: optionDraft.staticText || '' }
    }
    if (optionDraft.type === 'dynamic') {
      opt.payload = { mode: 'agent' }
    }
    setIvr((prev) => {
      const options = [...prev.options, opt]
      if (options.length > 3) setMenuOptionsExpanded(false)
      return { ...prev, options }
    })
    setError(null)
    setAddOptionModalOpen(false)
  }

  const removeOption = (idx) => {
    setIvr((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }))
  }

  const openEditOptionModal = (idx) => {
    const o = ivr.options[idx]
    if (!o) return
    setAddOptionModalOpen(false)
    setEditOptionIndex(idx)
    setEditOptionDraft({
      key: o.key ?? '',
      label: o.label ?? '',
      type: o.type || 'static',
      staticText: o.payload?.text ?? '',
    })
  }

  const closeEditOptionModal = () => {
    setEditOptionIndex(null)
    setEditOptionDraft(null)
  }

  const saveEditOptionModal = () => {
    if (editOptionIndex === null || !editOptionDraft) return
    const k = editOptionDraft.key.trim()
    const lab = editOptionDraft.label.trim()
    if (!k || !lab) {
      setError('Key and label are required.')
      return
    }
    setIvr((prev) => {
      const options = [...prev.options]
      const next = { key: k, label: lab, type: editOptionDraft.type }
      if (editOptionDraft.type === 'static') {
        next.payload = { text: editOptionDraft.staticText || '' }
      } else if (editOptionDraft.type === 'dynamic') {
        next.payload = { mode: 'agent' }
      } else {
        delete next.payload
      }
      options[editOptionIndex] = next
      return { ...prev, options }
    })
    setError(null)
    closeEditOptionModal()
  }

  const removeOptionFromEditModal = () => {
    if (editOptionIndex === null) return
    removeOption(editOptionIndex)
    closeEditOptionModal()
  }

  const webhookUrl = `${window.location.origin.replace(':3000', ':8001')}/api/webhooks/whatsapp/inbound`

  const activeChoices = [
    { value: true, label: 'Enabled', hint: 'Active' },
    { value: false, label: 'Disabled', hint: 'Off' },
  ]

  const boundChatbotId = selectedChatbotId || status.ai_chatbot_id || ''
  const boundChatbotName =
    chatbots.find((c) => c.id === boundChatbotId)?.name || (boundChatbotId ? boundChatbotId : null)

  const chatbotDropdownOptions = useMemo(() => {
    if (!chatbots.length) {
      return [{ value: '__none__', label: 'No chatbots — create under Chatbots' }]
    }
    const rows = chatbots.map((c) => ({ value: c.id, label: c.name }))
    if (!boundChatbotId) {
      return [{ value: '', label: 'Select a chatbot…' }, ...rows]
    }
    return rows
  }, [chatbots, boundChatbotId])

  const chatbotDropdownValue = chatbots.length === 0 ? '__none__' : boundChatbotId || ''

  const onboardingState = status.onboarding_status || 'not_started'
  const connectionBannerText =
    onboardingState === 'ready'
      ? 'WhatsApp is connected'
      : onboardingState === 'rejected'
        ? 'WhatsApp connection was rejected'
        : onboardingState === 'in_progress'
          ? 'WhatsApp connection in progress'
          : 'WhatsApp is not connected'

  const inputClass =
    'w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-none placeholder:text-gray-400 ring-1 ring-transparent transition hover:bg-gray-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/25'

  return (
    <div className="mx-auto p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-white rounded-lg p-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900">WhatsApp Integration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure WhatsApp automation and conversation flow
          </p>
          {isSuperUser && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">Tenant</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className={cn(inputClass, 'max-w-xs')}
              >
                {(tenants || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="px-4 py-2 !text-xs !font-semibold"
            onClick={() => {
              fetchIvr()
              fetchStatus()
            }}
            disabled={loading}
          >
            <RefreshCcw size={16} strokeWidth={2} />
            Refresh
          </Button>
          <Button type="button" variant="primary" className="px-4 py-2 !text-xs !font-normal" onClick={startOnboarding}>
            <WhatsAppGlyph className="h-4 w-4" />
            Connect
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 rounded-xl bg-white px-8 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex items-center gap-3 text-base font-medium text-slate-700">
          {onboardingState === 'ready' ? (
            <Wifi className="h-5 w-5 shrink-0 text-slate-700" strokeWidth={2} aria-hidden />
          ) : (
            <WifiOff className="h-5 w-5 shrink-0 text-slate-700" strokeWidth={2} aria-hidden />
          )}
          <span>{connectionBannerText}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ONBOARDING_STEPS.map(({ id: s, label }) => {
            const current = onboardingState === s
            return (
              <div
                key={s}
                className={cn(
                  'rounded-lg  px-4 py-2 text-xs font-medium transition-colors',
                  current
                    ? 'border-brand-teal border-2 bg-white text-gray-900'
                    : 'border-gray-200 border bg-white text-gray-400'
                )}
              >
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/90 p-4 text-sm">
        <p className="text-xs font-medium text-gray-600">
          Configure WhatsApp IVR menu for your tenant, and set your Twilio WhatsApp sender to post inbound messages to:
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-gray-800">
          <Info size={16} className="shrink-0 text-brand-teal" aria-hidden />
          <code className="break-all rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs">{webhookUrl}</code>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600">
          <span>
            Sender:{' '}
            <span className="font-medium text-gray-900">{status.from_number || 'Not configured'}</span>
          </span>
          <span className="hidden text-gray-300 sm:inline" aria-hidden>
            |
          </span>
          <span>
            Onboarding:{' '}
            <span className="font-medium text-gray-900">{status.onboarding_status || 'not_started'}</span>
          </span>
          <span className="hidden text-gray-300 sm:inline" aria-hidden>
            |
          </span>
          <span>
            Display name:{' '}
            <span className="font-medium text-gray-900">{status.display_name_status || 'unknown'}</span>
          </span>
        </div>
      </div> */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="min-w-0 space-y-4">
          <SettingsCard title="AI Chatbot" description="Select which chatbot handles messages">
            <div className="flex flex-col gap-2">
              <SelectDropdown
                variant="field"
                fieldBorderless
                leading={<Bot className="h-4 w-4 text-brand-teal" strokeWidth={2} aria-hidden />}
                excludeValuesFromMenu={['']}
                value={chatbotDropdownValue}
                onChange={(nextId) => {
                  if (!nextId || nextId === '__none__') return
                  setSelectedChatbotId(nextId)
                  bindChatbot(nextId)
                }}
                options={chatbotDropdownOptions}
                disabled={bindingChatbot || chatbots.length === 0}
                helperText={bindingChatbot ? 'Applying…' : undefined}
                className="!space-y-0"
              />
              {status.ai_chatbot_id && (
                <p className="text-xs text-gray-500">
                  Bound to: <span className="font-semibold text-gray-900">{boundChatbotName}</span>
                </p>
              )}
            </div>
          </SettingsCard>

          <SettingsCard title="Welcome Message" description="First message users see">
            <textarea
              value={ivr.welcome_text}
              onChange={(e) => setIvr((prev) => ({ ...prev, welcome_text: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </SettingsCard>

          <SettingsCard title="Help Message" description="Guide for users">
            <textarea
              value={ivr.help_text}
              onChange={(e) => setIvr((prev) => ({ ...prev, help_text: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </SettingsCard>
        </div>

        <div className="min-w-0 space-y-4">
          <SettingsCard title="Automation" description="Enable automated responses">
            <div className="grid grid-cols-2 gap-2 mt-2 sm:gap-3" role="radiogroup" aria-label="IVR active">
              {activeChoices.map(({ value, label, hint }) => {
                const selected = ivr.active === value
                return (
                  <CheckmarkRadioRow
                    key={label}
                    label={label}
                    hint={hint}
                    selected={selected}
                    accent="brand"
                    softSurface
                    selectedMark={
                      <img
                        src={value ? '/svgs/whatsapp/check.svg' : '/svgs/whatsapp/off.svg'}
                        alt=""
                        className="shrink-0"
                      />
                    }
                    onSelect={() => setIvr((prev) => ({ ...prev, active: value }))}
                  />
                )
              })}
            </div>
          </SettingsCard>

          <SettingsCard title="Session Duration" description="Minutes until conversation resets">
            <input
              type="number"
              min="1"
              value={ivr.session_ttl_minutes}
              onChange={(e) =>
                setIvr((prev) => ({ ...prev, session_ttl_minutes: parseInt(e.target.value) || 1 }))
              }
              className={cn(inputClass, 'max-w-full')}
            />
          </SettingsCard>

          <SettingsCard
            title="Menu Options"
            description="Define conversation flow"
            headerRight={
              <Button
                type="button"
                variant="primary"
                className="px-3 py-1.5 text-xs font-semibold"
                onClick={openAddOptionModal}
              >
                + Add
              </Button>
            }
          >

            <div className="mt-3 space-y-3">
              {ivr.options.length > 3 && (
                <button
                  type="button"
                  onClick={() => setMenuOptionsExpanded((e) => !e)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:bg-gray-50/80"
                >
                  <span className="font-medium text-gray-900">
                    {ivr.options.length} menu option{ivr.options.length === 1 ? '' : 's'} — tap to expand or
                    collapse
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-500 transition ${menuOptionsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
              {(ivr.options.length <= 3 || menuOptionsExpanded) && (
                <>
                  {ivr.options.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500">
                      No menu options yet. Use + Add.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {ivr.options.map((opt, idx) => {
                        const title = (opt.label && String(opt.label).trim()) || `Option ${idx + 1}`
                        const sub = optionSubtitle(opt)
                        return (
                          <li key={`opt-${idx}-${opt.key}`}>
                            <button
                              type="button"
                              onClick={() => openEditOptionModal(idx)}
                              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:bg-gray-50/90"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-800">
                                {opt.key ?? idx + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-normal text-gray-900">{title}</span>
                                {sub ? (
                                  <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">{sub}</span>
                                ) : null}
                              </span>
                              <span
                                className={cn(
                                  'shrink-0 rounded-sm px-2 py-0.5 text-xs font-normal',
                                  optionTypeChip(opt.type)
                                )}
                              >
                                {optionTypeShortLabel(opt.type)}
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 text-gray-400"
                                aria-hidden
                                strokeWidth={2}
                              />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          </SettingsCard>
        </div>
      </div>

      <div className=" flex justify-end  pt-6">
        <Button type="button" variant="primary" className="min-w-[10rem] px-6 py-2.5 text-sm" disabled={saving} onClick={saveIvr}>
          {/* <Save size={16} strokeWidth={2} /> */}
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>

      <Modal
        isOpen={addOptionModalOpen}
        onClose={() => setAddOptionModalOpen(false)}
        title="Add menu option"
        panelClassName=" max-h-[min(92vh,640px)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Key</label>
              <input
                value={optionDraft.key}
                onChange={(e) => setOptionDraft((d) => ({ ...d, key: e.target.value }))}
                placeholder="e.g. 1, 2, 0"
                className={modalInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Label</label>
              <input
                value={optionDraft.label}
                onChange={(e) => setOptionDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Shown to the user"
                className={modalInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Type</label>
              <TypePicker
                accentBrand
                value={optionDraft.type}
                onChange={(t) => setOptionDraft((d) => ({ ...d, type: t }))}
              />
            </div>
            {optionDraft.type === 'static' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900">Static text</label>
                <textarea
                  value={optionDraft.staticText}
                  onChange={(e) => setOptionDraft((d) => ({ ...d, staticText: e.target.value }))}
                  rows={4}
                  placeholder="Add static text..."
                  className={cn(modalInputClass, 'min-h-[120px] resize-y')}
                />
              </div>
            )}
          </div>
          <div className="mt-6 shrink-0 border-t border-gray-100 pt-5">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] flex-1 rounded-lg font-semibold"
                onClick={() => setAddOptionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="min-h-[44px] flex-1 rounded-lg font-semibold"
                onClick={submitAddOption}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editOptionIndex !== null && Boolean(editOptionDraft)}
        onClose={closeEditOptionModal}
        title="Edit menu option"
        panelClassName="max-h-[min(92vh,640px)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Key</label>
              <input
                value={editOptionDraft?.key ?? ''}
                onChange={(e) => setEditOptionDraft((d) => ({ ...d, key: e.target.value }))}
                placeholder="e.g. 1, 2, 0"
                className={modalInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Label</label>
              <input
                value={editOptionDraft?.label ?? ''}
                onChange={(e) => setEditOptionDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Shown to the user"
                className={modalInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">Type</label>
              <TypePicker
                accentBrand
                value={editOptionDraft?.type ?? 'static'}
                onChange={(t) => setEditOptionDraft((d) => ({ ...d, type: t }))}
              />
            </div>
            {editOptionDraft?.type === 'static' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900">Static text</label>
                <textarea
                  value={editOptionDraft?.staticText ?? ''}
                  onChange={(e) => setEditOptionDraft((d) => ({ ...d, staticText: e.target.value }))}
                  rows={4}
                  placeholder="Add static text..."
                  className={cn(modalInputClass, 'min-h-[120px] resize-y')}
                />
              </div>
            )}
          </div>
          <div className="mt-6 shrink-0 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={removeOptionFromEditModal}
                className="order-3 text-left text-sm font-semibold text-red-600 hover:text-red-700 sm:order-1"
              >
                Remove option
              </button>
              <div className="flex w-full gap-3 sm:order-2 sm:w-auto sm:flex-1 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] flex-1 rounded-lg font-semibold sm:min-w-[140px] sm:flex-initial"
                  onClick={closeEditOptionModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-[44px] flex-1 rounded-lg font-semibold sm:min-w-[140px] sm:flex-initial"
                  onClick={saveEditOptionModal}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDisclaimer}
        onClose={() => {
          if (accepting) return
          setShowDisclaimer(false)
        }}
        title="Meta/Twilio WhatsApp Disclaimer"
        showCloseButton={!accepting}
        panelClassName="max-w-[min(92vw,480px)] rounded-xl border border-gray-200/80 shadow-2xl ring-1 ring-black/5"
      >
        <div className="-mt-1">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
            <p className="text-xs leading-relaxed text-gray-600 sm:text-[13px]">
              You will be redirected to complete WhatsApp onboarding with the provider. Approval is determined by Meta
              and may be rejected. Without approval, WhatsApp services in MeiChat will not be available.
            </p>
          </div>
          <div className="-mx-4 mt-5 flex justify-end gap-3 border-t border-gray-100 px-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDisclaimer(false)}
              disabled={accepting}
              className="px-5"
            >
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={acceptDisclaimer} disabled={accepting} className="px-5">
              {accepting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Accepting…
                </>
              ) : (
                'I Understand & Accept'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
