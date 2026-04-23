import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { RefreshCw, Save, Wrench, X, ChevronRight } from 'lucide-react'
import config from '../config'

const API_URL = config.API_URL

/** Card groups: platform ``tool.*`` keys (aligned with backend ``tool_prompt_service``). */
const TOOL_CARD_GROUPS = [
  {
    id: 'search',
    title: 'Knowledge search',
    subtitle: 'search_vector_database',
    keys: ['tool.search.description'],
  },
  {
    id: 'save_lead',
    title: 'Save lead',
    subtitle: 'save_lead_to_database',
    keys: ['tool.save_lead.description'],
  },
  {
    id: 'extract_lead',
    title: 'Extract lead info',
    subtitle: 'extract_lead_info',
    keys: [
      'tool.extract_lead_info.description',
      'tool.extract_lead.field_system',
      'tool.extract_lead.field_template',
    ],
  },
  {
    id: 'lead_profile',
    title: 'Generate lead profile',
    subtitle: 'generate_lead_profile',
    keys: [
      'tool.lead_profile.description',
      'tool.lead_profile.system',
      'tool.lead_profile.template',
    ],
  },
  {
    id: 'scheduling',
    title: 'Scheduling intent',
    subtitle: 'check_scheduling_request',
    keys: ['tool.scheduling.description'],
  },
  {
    id: 'guardrails',
    title: 'Guardrails on context',
    subtitle: 'evaluate_guardrails_for_context',
    keys: [
      'tool.guardrails.evaluate.description',
      'tool.guardrails.evaluate.system',
      'tool.guardrails.evaluate.user_template',
    ],
  },
]

const FIELD_LABELS = {
  'tool.search.description': 'Tool description (main agent)',
  'tool.save_lead.description': 'Tool description (main agent)',
  'tool.extract_lead_info.description': 'Tool description (main agent)',
  'tool.extract_lead.field_system': 'Inner LLM — system message',
  'tool.extract_lead.field_template': 'Inner LLM — user template (keep {field_type}, {user_response}, {conversation_context_line})',
  'tool.lead_profile.description': 'Tool description (main agent)',
  'tool.lead_profile.system': 'Inner LLM — system message',
  'tool.lead_profile.template':
    'Inner LLM — user template (keep {conversation_history}, {lead_info_json}, {qualification_analysis_json})',
  'tool.scheduling.description': 'Tool description (main agent)',
  'tool.guardrails.evaluate.description': 'Tool description (main agent)',
  'tool.guardrails.evaluate.system': 'Inner LLM — system message',
  'tool.guardrails.evaluate.user_template':
    'Inner LLM — user template (keep {rules_text}, {user_query}, {context})',
}

export default function ToolsAdminTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingKey, setSavingKey] = useState(null)
  const [modalGroup, setModalGroup] = useState(null)
  const [drafts, setDrafts] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(`${API_URL}/api/platform/system-prompts`)
      const toolRows = (data || []).filter((r) => String(r.prompt_key || '').startsWith('tool.'))
      setRows(toolRows)
      const d = {}
      toolRows.forEach((r) => {
        d[r.prompt_key] = r.content
      })
      setDrafts(d)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load tool prompts')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rowByKey = useMemo(() => {
    const m = {}
    rows.forEach((r) => {
      m[r.prompt_key] = r
    })
    return m
  }, [rows])

  const openGroup = (group) => {
    const d = {}
    group.keys.forEach((k) => {
      d[k] = drafts[k] ?? rowByKey[k]?.content ?? ''
    })
    setModalGroup({ ...group, draftMap: d })
  }

  const closeModal = () => setModalGroup(null)

  const setModalDraft = (key, value) => {
    setModalGroup((prev) =>
      prev ? { ...prev, draftMap: { ...prev.draftMap, [key]: value } } : prev
    )
  }

  const saveKey = async (promptKey, content) => {
    setSavingKey(promptKey)
    setError(null)
    try {
      await axios.put(`${API_URL}/api/platform/system-prompts/${encodeURIComponent(promptKey)}`, {
        content,
      })
      setDrafts((prev) => ({ ...prev, [promptKey]: content }))
      setModalGroup((prev) =>
        prev ? { ...prev, draftMap: { ...prev.draftMap, [promptKey]: content } } : prev
      )
      await load()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Save failed')
    } finally {
      setSavingKey(null)
    }
  }

  useEffect(() => {
    if (!modalGroup) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalGroup])

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-8 text-white shadow-lg sm:px-8">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-5">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-inner sm:flex">
              <Wrench className="h-7 w-7 text-indigo-100" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Super Admin</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tools</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">
                Edit agent tool descriptions and inner prompts stored in the platform catalog. Changes apply on the next
                chat turn.
              </p>
              {!loading && (
                <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-100">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                    {TOOL_CARD_GROUPS.length} tool {TOOL_CARD_GROUPS.length === 1 ? 'group' : 'groups'}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.99] lg:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200/80 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm animate-slide-in"
        >
          {String(error)}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="relative border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/25 px-6 py-5 sm:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-400/40 to-violet-500/0"
            aria-hidden
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 items-stretch gap-4">
              <div
                className="w-1 shrink-0 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/25"
                aria-hidden
              />
              <div className="min-w-0 py-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Platform-wide</p>
                <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Agent tools</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Each card groups related strings (main-agent tool description and optional inner LLM prompts).
                </p>
              </div>
            </div>
            {!loading && (
              <div className="flex shrink-0 items-baseline gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
                <span className="text-2xl font-bold tabular-nums leading-none text-slate-900">
                  {TOOL_CARD_GROUPS.length}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {TOOL_CARD_GROUPS.length === 1 ? 'tool group' : 'tool groups'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {TOOL_CARD_GROUPS.map((group, idx) => {
                const missing = group.keys.some((k) => !rowByKey[k])
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => openGroup(group)}
                    style={{
                      animation: `slide-in 0.35s ease-out ${Math.min(idx, 12) * 45}ms both`,
                    }}
                    className="group relative flex w-full min-h-[5.75rem] items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md hover:ring-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80 transition-transform duration-200 group-hover:scale-105">
                      <Wrench className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <h3 className="font-semibold leading-snug text-slate-900">{group.title}</h3>
                      <p className="font-mono text-xs text-slate-500">{group.subtitle}</p>
                      <p className="text-xs text-slate-500">
                        {group.keys.length} editable {group.keys.length === 1 ? 'field' : 'fields'}
                        {missing && (
                          <span className="ml-2 font-medium text-amber-700">· run DB migration if missing</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight
                      className="mt-0.5 h-5 w-5 shrink-0 self-center text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                      aria-hidden
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {modalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={closeModal}
            aria-hidden
          />
          <div
            className="relative z-10 flex max-h-[min(85vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-slide-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tools-modal-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Wrench size={22} className="text-white" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 id="tools-modal-title" className="truncate text-lg font-semibold text-white">
                    {modalGroup.title}
                  </h2>
                  <p className="truncate font-mono text-xs text-white/80">{modalGroup.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {modalGroup.keys.map((promptKey) => (
                <div
                  key={promptKey}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {FIELD_LABELS[promptKey] || promptKey}
                  </label>
                  <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{promptKey}</p>
                  <textarea
                    className="mt-3 min-h-[min(36vh,280px)] w-full resize-y rounded-lg border border-slate-200/90 bg-white p-3 font-mono text-sm leading-relaxed text-slate-800 shadow-sm transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={modalGroup.draftMap[promptKey] ?? ''}
                    onChange={(e) => setModalDraft(promptKey, e.target.value)}
                    spellCheck={false}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={savingKey === promptKey}
                      onClick={() => saveKey(promptKey, modalGroup.draftMap[promptKey] ?? '')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-105 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Save className="h-4 w-4" />
                      {savingKey === promptKey ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
