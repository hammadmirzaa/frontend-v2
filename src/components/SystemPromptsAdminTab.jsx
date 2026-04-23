import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  RefreshCw,
  Save,
  Trash2,
  ScrollText,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Archive,
  RotateCcw,
  Check,
  Building2,
  Layers,
} from 'lucide-react'
import config from '../config'

const API_URL = config.API_URL

function sortPlatformRows(rows) {
  return [...rows].sort((a, b) => {
    const order = (k) => {
      if (k === 'agent.template.default') return 0
      if (k.startsWith('agent.template.')) return 1
      if (k === 'agent.guidelines') return 2
      return 3
    }
    const d = order(a.prompt_key) - order(b.prompt_key)
    if (d !== 0) return d
    return (a.prompt_key || '').localeCompare(b.prompt_key || '')
  })
}

function sortTemplateRowsOnly(rows) {
  const templates = rows.filter((r) => r.prompt_key.startsWith('agent.template.'))
  return [...templates].sort((a, b) => {
    if (a.prompt_key === 'agent.template.default') return -1
    if (b.prompt_key === 'agent.template.default') return 1
    return (a.prompt_key || '').localeCompare(b.prompt_key || '')
  })
}

const NEW_TEMPLATE_PLACEHOLDER = `You are {agent_name}, … for {company_name}.

Use {company_name} and {agent_name} where the tenant name and bot name should appear.`

/** Cannot be archived or permanently removed. */
const PROTECTED_PROMPT_KEYS = new Set(['agent.template.default', 'agent.guidelines'])

/**
 * Material Design–style surface (Paper): elevation shadows without @mui.
 * @param {'elevation' | 'outlined'} variant
 * @param {1 | 2 | 3 | 4} elevation — used when variant is elevation
 */
function Paper({ children, className = '', elevation = 1, variant = 'elevation' }) {
  const shadows = {
    1: 'shadow-[0px_2px_1px_-1px_rgba(15,23,42,0.06),0px_1px_1px_0px_rgba(15,23,42,0.05),0px_1px_3px_0px_rgba(15,23,42,0.08)]',
    2: 'shadow-[0px_3px_5px_-1px_rgba(15,23,42,0.08),0px_6px_10px_0px_rgba(15,23,42,0.06),0px_1px_18px_0px_rgba(15,23,42,0.05)]',
    3: 'shadow-[0px_5px_5px_-3px_rgba(15,23,42,0.08),0px_8px_10px_1px_rgba(15,23,42,0.06),0px_3px_14px_2px_rgba(15,23,42,0.05)]',
    4: 'shadow-[0px_8px_10px_-5px_rgba(15,23,42,0.1),0px_16px_24px_2px_rgba(15,23,42,0.07),0px_6px_30px_5px_rgba(15,23,42,0.05)]',
  }
  const base =
    variant === 'outlined'
      ? 'rounded-2xl border border-slate-200 bg-white shadow-sm'
      : `rounded-2xl border border-slate-200/80 bg-white ${shadows[elevation] || shadows[1]}`
  return <div className={`${base} ${className}`.trim()}>{children}</div>
}

export default function SystemPromptsAdminTab() {
  const [platformPrompts, setPlatformPrompts] = useState([])
  const [archivedPrompts, setArchivedPrompts] = useState([])
  /** Archived block starts collapsed for a cleaner default view. */
  const [archivedSectionOpen, setArchivedSectionOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingKey, setSavingKey] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [modalPrompt, setModalPrompt] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    template_slug: '',
    title: '',
    description: '',
    content: NEW_TEMPLATE_PLACEHOLDER,
  })
  const [creating, setCreating] = useState(false)

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [overrides, setOverrides] = useState([])
  const [archivedTenantOverrides, setArchivedTenantOverrides] = useState([])
  const [tenantArchivedOpen, setTenantArchivedOpen] = useState(false)
  const [overrideDraft, setOverrideDraft] = useState({ prompt_key: '', content: '' })
  const [loadingOverrides, setLoadingOverrides] = useState(false)
  /** Modal pickers for tenant org and prompt key (card UI, same motion language as platform grid). */
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false)
  const [promptKeyPickerOpen, setPromptKeyPickerOpen] = useState(false)
  const loadPlatform = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [activeRes, archivedRes] = await Promise.all([
        axios.get(`${API_URL}/api/platform/system-prompts`),
        axios.get(`${API_URL}/api/platform/system-prompts/archived`),
      ])
      const data = activeRes.data || []
      const archived = archivedRes.data || []
      const stripToolPrompts = (rows) =>
        (rows || []).filter((r) => !String(r.prompt_key || '').startsWith('tool.'))
      setPlatformPrompts(stripToolPrompts(data))
      setArchivedPrompts(stripToolPrompts(archived))
      const next = {}
      data.forEach((row) => {
        next[row.prompt_key] = row.content
      })
      archived.forEach((row) => {
        next[row.prompt_key] = row.content
      })
      setDrafts(next)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTenants = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/tenants/`, { params: { page: 1, page_size: 200 } })
      setTenants(data.items || [])
    } catch {
      setTenants([])
    }
  }, [])

  useEffect(() => {
    loadPlatform()
    loadTenants()
  }, [loadPlatform, loadTenants])

  /** @returns {Promise<Array<{ id: string, prompt_key: string, content: string, tenant_id?: string }>>} active overrides */
  const loadOverrides = async (tid) => {
    if (!tid) {
      setOverrides([])
      setArchivedTenantOverrides([])
      return []
    }
    setLoadingOverrides(true)
    try {
      const [activeRes, archivedRes] = await Promise.all([
        axios.get(`${API_URL}/api/platform/tenants/${tid}/system-prompt-overrides`),
        axios.get(`${API_URL}/api/platform/tenants/${tid}/system-prompt-overrides/archived`),
      ])
      const active = activeRes.data?.overrides || []
      const archived = archivedRes.data?.overrides || []
      setOverrides(active)
      setArchivedTenantOverrides(archived)
      return active
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load overrides')
      setOverrides([])
      setArchivedTenantOverrides([])
      return []
    } finally {
      setLoadingOverrides(false)
    }
  }

  useEffect(() => {
    if (tenantId) loadOverrides(tenantId)
    else {
      setOverrides([])
      setArchivedTenantOverrides([])
    }
  }, [tenantId])

  const activeOverrideKeySet = useMemo(
    () => new Set((overrides || []).map((o) => o.prompt_key)),
    [overrides],
  )

  const selectedTenant = useMemo(
    () => (tenantId ? tenants.find((t) => t.id === tenantId) : null),
    [tenantId, tenants],
  )

  const selectedOverrideEditorKey = overrideDraft.prompt_key

  const baselinePlatformText = useCallback(
    (pk) => drafts[pk] ?? platformPrompts.find((p) => p.prompt_key === pk)?.content ?? '',
    [drafts, platformPrompts],
  )

  const selectedKeyHasActiveOverride = useMemo(
    () =>
      Boolean(selectedOverrideEditorKey && activeOverrideKeySet.has(selectedOverrideEditorKey)),
    [activeOverrideKeySet, selectedOverrideEditorKey],
  )

  const selectedPlatformMeta = useMemo(
    () =>
      selectedOverrideEditorKey
        ? platformPrompts.find((p) => p.prompt_key === selectedOverrideEditorKey)
        : null,
    [platformPrompts, selectedOverrideEditorKey],
  )

  useEffect(() => {
    if (!modalPrompt && !createModalOpen && !tenantPickerOpen && !promptKeyPickerOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (promptKeyPickerOpen) {
        setPromptKeyPickerOpen(false)
        return
      }
      if (tenantPickerOpen) {
        setTenantPickerOpen(false)
        return
      }
      setModalPrompt(null)
      setCreateModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalPrompt, createModalOpen, tenantPickerOpen, promptKeyPickerOpen])

  const closeModal = () => setModalPrompt(null)

  const openCreateModal = () => {
    setModalPrompt(null)
    setCreateForm({
      template_slug: '',
      title: '',
      description: '',
      content: NEW_TEMPLATE_PLACEHOLDER,
    })
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false)
  }

  const submitNewTemplate = async () => {
    const slug = createForm.template_slug.trim().toLowerCase()
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      setError('Template id must start with a letter and use only lowercase letters, numbers, and underscores.')
      return
    }
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setError('Title and agent body are required.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await axios.post(`${API_URL}/api/platform/system-prompts/template`, {
        template_slug: slug,
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
        content: createForm.content,
      })
      closeCreateModal()
      await loadPlatform()
    } catch (e) {
      const d = e.response?.data?.detail
      let msg = e.message || 'Could not create template'
      if (typeof d === 'string') msg = d
      else if (Array.isArray(d)) msg = d.map((x) => x?.msg || JSON.stringify(x)).join(' ')
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  const savePlatform = async (prompt_key) => {
    const content = drafts[prompt_key]
    if (content == null || !String(content).trim()) return
    setSavingKey(prompt_key)
    setError(null)
    try {
      await axios.put(
        `${API_URL}/api/platform/system-prompts/${encodeURIComponent(prompt_key)}`,
        { content },
      )
      await loadPlatform()
      closeModal()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Save failed')
    } finally {
      setSavingKey(null)
    }
  }

  const archivePlatform = async (prompt_key) => {
    if (PROTECTED_PROMPT_KEYS.has(prompt_key)) return
    if (!window.confirm(`Archive this agent?\n\n${prompt_key}\n\nIt will stop being used until you restore it from the archived list.`)) return
    setSavingKey(`archive:${prompt_key}`)
    setError(null)
    try {
      await axios.post(
        `${API_URL}/api/platform/system-prompts/${encodeURIComponent(prompt_key)}/archive`,
      )
      closeModal()
      setArchivedSectionOpen(true)
      await loadPlatform()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Archive failed')
    } finally {
      setSavingKey(null)
    }
  }

  const restorePlatform = async (prompt_key) => {
    setSavingKey(`restore:${prompt_key}`)
    setError(null)
    try {
      await axios.post(
        `${API_URL}/api/platform/system-prompts/${encodeURIComponent(prompt_key)}/restore`,
      )
      closeModal()
      await loadPlatform()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Restore failed')
    } finally {
      setSavingKey(null)
    }
  }

  const permanentlyDeletePlatform = async (prompt_key) => {
    if (PROTECTED_PROMPT_KEYS.has(prompt_key)) return
    if (
      !window.confirm(
        `Permanently delete "${prompt_key}"?\n\nThis cannot be undone. Tenant overrides for this key will also be removed.`,
      )
    )
      return
    if (!window.confirm('Last chance — permanently remove this archived agent?')) return
    setSavingKey(`perm:${prompt_key}`)
    setError(null)
    try {
      await axios.delete(
        `${API_URL}/api/platform/system-prompts/${encodeURIComponent(prompt_key)}/permanent`,
      )
      closeModal()
      await loadPlatform()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Permanent delete failed')
    } finally {
      setSavingKey(null)
    }
  }

  const saveOverride = async () => {
    if (!tenantId || !overrideDraft.prompt_key || !overrideDraft.content.trim()) return
    const tidAtSave = tenantId
    const pk = overrideDraft.prompt_key
    setSavingKey(`ov:${pk}`)
    setError(null)
    try {
      const { data } = await axios.put(
        `${API_URL}/api/platform/tenants/${tidAtSave}/system-prompt-overrides/${encodeURIComponent(pk)}`,
        { content: overrideDraft.content },
      )
      if (data?.tenant_id && data.tenant_id !== tidAtSave) {
        setError('Server returned a different tenant for this override. Reload and try again.')
        await loadOverrides(tenantId)
        return
      }
      if (tenantId !== tidAtSave) {
        setError('Tenant selection changed while saving. Pick the tenant again and save.')
        await loadOverrides(tenantId)
        return
      }
      const list = await loadOverrides(tidAtSave)
      const o = list.find((x) => x.prompt_key === pk)
      setOverrideDraft({ prompt_key: pk, content: o?.content ?? baselinePlatformText(pk) })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to save organization agent')
    } finally {
      setSavingKey(null)
    }
  }

  const archiveTenantOverride = async (prompt_key) => {
    if (!tenantId) return
    const tidAtSave = tenantId
    if (!window.confirm(`Archive override for ${prompt_key}? It will stop applying until restored.`)) return
    setError(null)
    try {
      await axios.post(
        `${API_URL}/api/platform/tenants/${tidAtSave}/system-prompt-overrides/${encodeURIComponent(prompt_key)}/archive`,
      )
      if (tenantId !== tidAtSave) {
        setError('Tenant selection changed while archiving. Reload overrides for the correct tenant.')
        await loadOverrides(tenantId)
        return
      }
      if (modalPrompt?.prompt_key === prompt_key) closeModal()
      const list = await loadOverrides(tidAtSave)
      setOverrideDraft((d) => {
        if (d.prompt_key !== prompt_key) return d
        const o = list.find((x) => x.prompt_key === prompt_key)
        return { ...d, content: o?.content ?? baselinePlatformText(prompt_key) }
      })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Archive failed')
    }
  }

  const restoreTenantOverride = async (prompt_key) => {
    if (!tenantId) return
    const tidAtSave = tenantId
    setSavingKey(`trestore:${prompt_key}`)
    setError(null)
    try {
      await axios.post(
        `${API_URL}/api/platform/tenants/${tidAtSave}/system-prompt-overrides/${encodeURIComponent(prompt_key)}/restore`,
      )
      if (tenantId !== tidAtSave) {
        setError('Tenant selection changed while restoring. Reload overrides for the correct tenant.')
        await loadOverrides(tenantId)
        return
      }
      const list = await loadOverrides(tidAtSave)
      setOverrideDraft((d) => {
        if (d.prompt_key !== prompt_key) return d
        const o = list.find((x) => x.prompt_key === prompt_key)
        return { ...d, content: o?.content ?? baselinePlatformText(prompt_key) }
      })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Restore failed')
    } finally {
      setSavingKey(null)
    }
  }

  const permanentlyDeleteTenantOverride = async (prompt_key) => {
    if (!tenantId) return
    const tidAtSave = tenantId
    if (!window.confirm(`Permanently delete the archived override for ${prompt_key}? This cannot be undone.`)) return
    setSavingKey(`tperm:${prompt_key}`)
    setError(null)
    try {
      await axios.delete(
        `${API_URL}/api/platform/tenants/${tidAtSave}/system-prompt-overrides/${encodeURIComponent(prompt_key)}/permanent`,
      )
      if (tenantId !== tidAtSave) {
        setError('Tenant selection changed while deleting. Reload overrides for the correct tenant.')
        await loadOverrides(tenantId)
        return
      }
      const list = await loadOverrides(tidAtSave)
      setOverrideDraft((d) => {
        if (d.prompt_key !== prompt_key) return d
        const o = list.find((x) => x.prompt_key === prompt_key)
        return { ...d, content: o?.content ?? baselinePlatformText(prompt_key) }
      })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Permanent delete failed')
    } finally {
      setSavingKey(null)
    }
  }

  const handleTenantSelectChange = (nextId) => {
    setModalPrompt(null)
    setOverrideDraft({ prompt_key: '', content: '' })
    setTenantId(nextId)
  }

  const pickTenant = (nextId) => {
    handleTenantSelectChange(nextId)
    setTenantPickerOpen(false)
  }

  const pickPromptKey = (pk) => {
    const o = overrides.find((x) => x.prompt_key === pk)
    const platformCopy = baselinePlatformText(pk)
    const content = o != null && (o.content || '').trim() ? o.content : platformCopy
    setOverrideDraft({ prompt_key: pk, content })
    setPromptKeyPickerOpen(false)
  }

  const promptRowsForPicker = useMemo(() => sortPlatformRows(platformPrompts), [platformPrompts])

  const sortedPlatform = sortPlatformRows(platformPrompts)
  const templateRowsForGrid = sortTemplateRowsOnly(platformPrompts)
  const guidelinesRows = platformPrompts.filter((r) => r.prompt_key === 'agent.guidelines')
  const sortedArchived = sortPlatformRows(archivedPrompts)
  const isArchivedModal = Boolean(modalPrompt?.is_deleted)

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Hero — aligned with SuperAdminDashboardTab */}
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
              <ScrollText className="h-7 w-7 text-indigo-100" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Super Admin</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Agents</h1>
              {!loading && (platformPrompts.length > 0 || archivedPrompts.length > 0) && (
                <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-100">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                    {sortedPlatform.length} active {sortedPlatform.length === 1 ? 'agent' : 'agents'}
                  </span>
                  {archivedPrompts.length > 0 && (
                    <span className="text-white/70">
                      · {archivedPrompts.length} archived
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadPlatform()}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.99] lg:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh list
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200/80 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm"
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
                <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Default agents
                </h2>
              </div>
            </div>
            {!loading && (
              <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                {sortedPlatform.length > 0 && (
                  <div className="flex items-baseline gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
                    <span className="text-2xl font-bold tabular-nums leading-none text-slate-900">{sortedPlatform.length}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {sortedPlatform.length === 1 ? 'agent' : 'agents'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] sm:px-5"
                >
                  <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                  Add agent template
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templateRowsForGrid.map((row) => (
                <button
                  key={row.prompt_key}
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false)
                    setModalPrompt(row)
                  }}
                  className="group relative flex w-full min-h-[5.75rem] items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md hover:ring-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80 transition-transform duration-200 group-hover:scale-105">
                    <ScrollText size={20} strokeWidth={2} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold leading-snug text-slate-900">
                        {row.title || row.prompt_key}
                      </h3>
                      {tenantId && activeOverrideKeySet.has(row.prompt_key) && (
                        <span className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                          Overridden
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={20}
                      className="shrink-0 self-end text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:self-auto"
                      aria-hidden
                    />
                  </div>
                </button>
              ))}
              {guidelinesRows.map((row) => (
                <button
                  key={row.prompt_key}
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false)
                    setModalPrompt(row)
                  }}
                  className="group relative flex w-full min-h-[5.75rem] items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md hover:ring-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80 transition-transform duration-200 group-hover:scale-105">
                    <ScrollText size={20} strokeWidth={2} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold leading-snug text-slate-900">
                        {row.title || row.prompt_key}
                      </h3>
                      {tenantId && activeOverrideKeySet.has(row.prompt_key) && (
                        <span className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                          Overridden
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={20}
                      className="shrink-0 self-end text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:self-auto"
                      aria-hidden
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && archivedPrompts.length > 0 && (
            <div className="mt-8">
              <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100/40 shadow-sm">
                <button
                  type="button"
                  id="archived-prompts-disclosure"
                  aria-expanded={archivedSectionOpen}
                  aria-controls="archived-prompts-panel"
                  onClick={() => setArchivedSectionOpen((o) => !o)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-200/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/40 sm:gap-4 sm:px-4 sm:py-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-500">
                    <Archive className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Archived
                      </span>
                      <span className="rounded bg-slate-300/50 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                        {archivedPrompts.length}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-slate-500">
                      Hidden from chatbots. Restore or delete to free the id.
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                      archivedSectionOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                <div
                  id="archived-prompts-panel"
                  role="region"
                  aria-labelledby="archived-prompts-disclosure"
                  hidden={!archivedSectionOpen}
                  className={archivedSectionOpen ? 'border-t border-slate-200/70 bg-slate-50/50' : ''}
                >
                  {archivedSectionOpen && (
                    <div className="p-2.5 sm:p-3">
                      <ul className="grid grid-cols-2 gap-2" role="list">
                        {sortedArchived.map((row) => (
                          <li
                            key={row.prompt_key}
                            className="flex min-w-0 flex-col rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 sm:text-[15px]">
                                {row.title || row.prompt_key}
                              </p>
                              <p
                                className="mt-2 rounded border border-slate-100 bg-slate-50/90 px-2 py-1.5 font-mono text-xs leading-snug text-slate-600 [overflow-wrap:anywhere] [word-break:break-word] sm:text-[13px]"
                                title={row.prompt_key}
                              >
                                {row.prompt_key}
                              </p>
                            </div>
                            <div
                              className="mt-2.5 grid min-h-[3.25rem] grid-cols-3 gap-px overflow-hidden rounded-md border border-slate-200/80 bg-slate-200/60"
                              role="group"
                              aria-label={`Actions for ${row.prompt_key}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateModalOpen(false)
                                  setModalPrompt(row)
                                }}
                                className="flex flex-col items-center justify-center gap-1 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:text-sm"
                                title="View agent body"
                              >
                                <ScrollText className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => restorePlatform(row.prompt_key)}
                                disabled={savingKey === `restore:${row.prompt_key}`}
                                className="flex flex-col items-center justify-center gap-1 border-x border-slate-200/80 bg-indigo-50/40 py-2.5 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-50/90 disabled:opacity-50 sm:text-sm"
                                title="Restore to active agents"
                              >
                                <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => permanentlyDeletePlatform(row.prompt_key)}
                                disabled={
                                  PROTECTED_PROMPT_KEYS.has(row.prompt_key) || savingKey === `perm:${row.prompt_key}`
                                }
                                className="flex flex-col items-center justify-center gap-1 bg-white py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50/90 disabled:pointer-events-none disabled:opacity-35 sm:text-sm"
                                title="Permanently delete this agent and tenant overrides"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal — pattern aligned with ConversationDetailModal / History */}
      {modalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={closeModal}
            aria-hidden
          />
          <div
            className="relative flex max-h-[min(85vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-slide-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="system-prompt-modal-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <ScrollText size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 id="system-prompt-modal-title" className="truncate text-lg font-semibold text-white">
                    {modalPrompt.title || modalPrompt.prompt_key}
                  </h2>
                  <p className="truncate font-mono text-xs text-white/80">{modalPrompt.prompt_key}</p>
                  {tenantId && selectedTenant && (
                    <p className="mt-1 truncate text-[11px] font-medium text-violet-100">
                      Viewing as: {selectedTenant.name || 'Unnamed organization'}
                    </p>
                  )}
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

            {modalPrompt.description && (
              <div className="border-b bg-gray-50 px-5 py-3 text-sm text-gray-600">{modalPrompt.description}</div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {tenantId && !isArchivedModal && (
                <p className="rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                  Per-organization overrides for <span className="font-semibold text-slate-800">{selectedTenant?.name || 'this organization'}</span> are edited in{' '}
                  <span className="font-semibold text-slate-800">Organization agent overrides</span> below — not in this
                  dialog.
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tenantId && !isArchivedModal ? 'Default agent (organization-wide)' : 'Agent content'}
                </label>
                <label className="sr-only" htmlFor="system-prompt-editor">
                  Agent prompt content
                </label>
                <textarea
                  id="system-prompt-editor"
                  readOnly={isArchivedModal}
                  className={`w-full resize-y rounded-lg border border-slate-200 p-3 font-mono text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-[min(55vh,420px)] bg-slate-50/50 ${
                    isArchivedModal ? 'cursor-default bg-slate-100/80' : ''
                  }`}
                  value={drafts[modalPrompt.prompt_key] ?? ''}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [modalPrompt.prompt_key]: e.target.value }))
                  }
                  spellCheck={false}
                />
              </div>

              {isArchivedModal && (
                <p className="text-xs text-slate-500">Archived prompts are read-only. Restore to edit again.</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
              {isArchivedModal ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => restorePlatform(modalPrompt.prompt_key)}
                    disabled={savingKey === `restore:${modalPrompt.prompt_key}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {savingKey === `restore:${modalPrompt.prompt_key}` ? 'Restoring…' : 'Restore'}
                  </button>
                  <button
                    type="button"
                    onClick={() => permanentlyDeletePlatform(modalPrompt.prompt_key)}
                    disabled={
                      PROTECTED_PROMPT_KEYS.has(modalPrompt.prompt_key) ||
                      savingKey === `perm:${modalPrompt.prompt_key}`
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    {savingKey === `perm:${modalPrompt.prompt_key}` ? 'Deleting…' : 'Delete forever'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!tenantId && !PROTECTED_PROMPT_KEYS.has(modalPrompt.prompt_key) && (
                    <button
                      type="button"
                      onClick={() => archivePlatform(modalPrompt.prompt_key)}
                      disabled={savingKey === `archive:${modalPrompt.prompt_key}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                      title="Archives this default agent for all organizations. Hidden while a tenant is selected."
                    >
                      <Archive className="h-4 w-4" />
                      {savingKey === `archive:${modalPrompt.prompt_key}` ? 'Archiving…' : 'Archive agent'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => savePlatform(modalPrompt.prompt_key)}
                    disabled={savingKey === modalPrompt.prompt_key}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingKey === modalPrompt.prompt_key ? 'Saving…' : 'Save default agent'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={closeCreateModal}
            aria-hidden
          />
          <div
            className="relative flex max-h-[min(90vh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-slide-in sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-template-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Plus size={22} className="text-white" strokeWidth={2.25} />
                </div>
                <h2 id="create-template-title" className="text-lg font-semibold text-white">
                  Create agent template
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tpl-slug">
                  Template id
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono text-xs text-slate-500">
                  <span>agent.template.</span>
                  <input
                    id="tpl-slug"
                    className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. onboarding_bot"
                    value={createForm.template_slug}
                    onChange={(e) => setCreateForm((f) => ({ ...f, template_slug: e.target.value }))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Lowercase letters, numbers, underscores. Shown in the chatbot template picker.</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tpl-title">
                  Display title
                </label>
                <input
                  id="tpl-title"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Name in the admin list"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tpl-desc">
                  Short description (optional)
                </label>
                <input
                  id="tpl-desc"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="One line for the template picker"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tpl-body">
                  Agent body
                </label>
                <textarea
                  id="tpl-body"
                  className="mt-1.5 h-48 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 p-3 font-mono text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                  value={createForm.content}
                  onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewTemplate}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creating…' : 'Create agent template'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="relative border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100/40 px-6 py-5 sm:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-slate-400/0 via-slate-400/35 to-slate-400/0"
            aria-hidden
          />
          <div className="flex min-w-0 items-stretch gap-4">
            <div
              className="w-1 shrink-0 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 shadow-sm"
              aria-hidden
            />
            <div className="min-w-0 py-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Per organization</p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Organization agent overrides
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <Paper elevation={2} className="max-w-md p-5 sm:p-6">
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Tenant organization
            </span>
            <button
              type="button"
              onClick={() => {
                setPromptKeyPickerOpen(false)
                setTenantPickerOpen(true)
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-3.5 text-left text-sm font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-900/[0.04] transition-all duration-200 hover:border-indigo-200 hover:bg-white hover:shadow-[0px_2px_8px_-2px_rgba(79,70,229,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <span className="min-w-0 truncate">
                {tenantId ? selectedTenant?.name || 'Unnamed organization' : 'Choose a tenant…'}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-indigo-500"
                aria-hidden
              />
            </button>
          </Paper>

          {tenantId && (
            <div className="space-y-6 border-t border-slate-200/60 pt-8">
              <Paper elevation={3} className="max-w-4xl overflow-hidden transition-shadow duration-300">
                <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/25 px-6 py-5 sm:px-8 sm:py-6">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
                      <Layers className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 self-center">
                      <h3 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                        Agent override editor
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-6 py-5 sm:px-8 sm:py-6">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Agent</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTenantPickerOpen(false)
                      setPromptKeyPickerOpen(true)
                    }}
                    className="group mt-3 flex w-full max-w-lg items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-left text-sm font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-slate-900/[0.04] transition-all duration-200 hover:border-indigo-200 hover:bg-white hover:shadow-[0px_4px_14px_-4px_rgba(79,70,229,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {overrideDraft.prompt_key
                        ? platformPrompts.find((p) => p.prompt_key === overrideDraft.prompt_key)?.title ||
                          overrideDraft.prompt_key
                        : 'Select an agent…'}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-500"
                      aria-hidden
                    />
                  </button>
                </div>

                {overrideDraft.prompt_key && (
                  <div className="border-t border-slate-200/80 bg-slate-50/40 px-6 py-6 sm:px-8 sm:py-8">
                    {loadingOverrides ? (
                      <div className="h-28 animate-pulse rounded-2xl bg-slate-200/50" />
                    ) : (
                      <Paper variant="outlined" className="overflow-hidden border-slate-200/90 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Effective prompt
                          </h4>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <code className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-800 ring-1 ring-slate-200/90">
                              {overrideDraft.prompt_key}
                            </code>
                            {selectedPlatformMeta?.title && (
                              <span className="text-xs font-medium text-slate-600">{selectedPlatformMeta.title}</span>
                            )}
                            {selectedKeyHasActiveOverride ? (
                              <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                                Overridden
                              </span>
                            ) : (
                              <span className="rounded-md bg-slate-200/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                Platform only
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-5 bg-white p-5 sm:p-6">
                          <div>
                            <label
                              className="block text-xs font-bold uppercase tracking-wide text-slate-600"
                              htmlFor="tenant-full-prompt-body"
                            >
                              Agent prompt
                            </label>
                            {selectedKeyHasActiveOverride && (
                              <p
                                className="mt-2 rounded-lg border border-violet-200/80 bg-violet-50/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-violet-900"
                                role="status"
                              >
                                Active override
                              </p>
                            )}
                            <textarea
                              id="tenant-full-prompt-body"
                              className="mt-3 min-h-[min(42vh,360px)] w-full resize-y rounded-xl border border-slate-200/90 bg-white p-4 font-mono text-sm leading-relaxed text-slate-800 shadow-sm transition-shadow focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder="Full agent text for this organization…"
                              value={overrideDraft.content}
                              onChange={(e) => setOverrideDraft((d) => ({ ...d, content: e.target.value }))}
                              spellCheck={false}
                            />
                            {!baselinePlatformText(overrideDraft.prompt_key) &&
                              !String(overrideDraft.content).trim() && (
                                <p className="mt-2 text-xs font-medium text-amber-800">
                                  No default agent text in memory for this key. Reload the page or open the agent in the
                                  grid above.
                                </p>
                              )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                            <button
                              type="button"
                              onClick={saveOverride}
                              disabled={
                                !overrideDraft.prompt_key ||
                                !String(overrideDraft.content).trim() ||
                                savingKey?.startsWith('ov:')
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-105 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Save className="h-4 w-4" />
                              Save organization agent
                            </button>
                            {selectedKeyHasActiveOverride && (
                              <button
                                type="button"
                                onClick={() => archiveTenantOverride(overrideDraft.prompt_key)}
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100/90 hover:shadow"
                              >
                                <Archive className="h-4 w-4" />
                                Archive override
                              </button>
                            )}
                          </div>
                        </div>
                      </Paper>
                    )}
                  </div>
                )}

                {archivedTenantOverrides.length > 0 && (
                  <div className="border-t border-slate-200/80 bg-slate-50/50 px-6 py-5 sm:px-8">
                    <Paper variant="outlined" className="overflow-hidden border-slate-200/90">
                      <button
                        type="button"
                        onClick={() => setTenantArchivedOpen((x) => !x)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-5 sm:py-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
                            <Archive className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-slate-800">Archived organization overrides</span>
                            <span className="ml-2 inline-flex rounded-md bg-slate-200/80 px-2 py-0.5 align-middle text-xs font-bold tabular-nums text-slate-700">
                              {archivedTenantOverrides.length}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                            tenantArchivedOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>
                      {tenantArchivedOpen && (
                        <ul className="divide-y divide-slate-200 border-t border-slate-200/80 bg-white">
                          {archivedTenantOverrides.map((o) => (
                            <li
                              key={o.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                            >
                              <code className="font-mono text-xs text-slate-600">{o.prompt_key}</code>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => restoreTenantOverride(o.prompt_key)}
                                  disabled={savingKey === `trestore:${o.prompt_key}`}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100/80 disabled:opacity-50"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => permanentlyDeleteTenantOverride(o.prompt_key)}
                                  disabled={savingKey === `tperm:${o.prompt_key}`}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100/80 disabled:opacity-50"
                                >
                                  Delete forever
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Paper>
                  </div>
                )}
              </Paper>
            </div>
          )}
        </div>
      </section>

      {tenantPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setTenantPickerOpen(false)}
            aria-hidden
          />
          <div
            className="relative flex max-h-[min(85vh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0px_8px_10px_-5px_rgba(15,23,42,0.1),0px_16px_24px_2px_rgba(15,23,42,0.07),0px_6px_30px_5px_rgba(15,23,42,0.05)] animate-slide-in sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-picker-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <h2 id="tenant-picker-title" className="text-lg font-semibold text-white">
                Select organization
              </h2>
              <button
                type="button"
                onClick={() => setTenantPickerOpen(false)}
                className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {tenants.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No organizations loaded. Refresh the page or check your access.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tenants.map((t, idx) => {
                    const selected = t.id === tenantId
                    const label = t.name?.trim() || 'Unnamed organization'
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => pickTenant(t.id)}
                        className={`group relative flex w-full min-h-[4.5rem] items-stretch gap-3 overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                          selected
                            ? 'border-indigo-400 ring-2 ring-indigo-500/35'
                            : 'border-slate-200/90 ring-slate-900/[0.03] hover:border-indigo-200/80 hover:ring-indigo-500/10'
                        }`}
                        style={{ animation: `slide-in 0.35s ease-out ${Math.min(idx, 12) * 45}ms both` }}
                      >
                        <span
                          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          aria-hidden
                        />
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80 transition-transform duration-200 group-hover:scale-105">
                          <Building2 size={20} strokeWidth={2} aria-hidden />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <h3 className="truncate text-[15px] font-semibold leading-snug text-slate-900">{label}</h3>
                        </div>
                        {selected ? (
                          <Check
                            className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
                            strokeWidth={2.5}
                            aria-label="Selected"
                          />
                        ) : (
                          <ChevronRight
                            size={20}
                            className="mt-0.5 shrink-0 self-center text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                            aria-hidden
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {promptKeyPickerOpen && tenantId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setPromptKeyPickerOpen(false)}
            aria-hidden
          />
          <div
            className="relative flex max-h-[min(85vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0px_8px_10px_-5px_rgba(15,23,42,0.1),0px_16px_24px_2px_rgba(15,23,42,0.07),0px_6px_30px_5px_rgba(15,23,42,0.05)] animate-slide-in sm:max-w-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-key-picker-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <h2 id="prompt-key-picker-title" className="text-lg font-semibold text-white">
                Select agent
              </h2>
              <button
                type="button"
                onClick={() => setPromptKeyPickerOpen(false)}
                className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {promptRowsForPicker.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No active agents. Add a template in Default agents above.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {promptRowsForPicker.map((p, idx) => {
                    const selected = p.prompt_key === overrideDraft.prompt_key
                    return (
                      <button
                        key={p.prompt_key}
                        type="button"
                        onClick={() => pickPromptKey(p.prompt_key)}
                        className={`group relative flex w-full min-h-[5.25rem] items-stretch gap-3 overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                          selected
                            ? 'border-indigo-400 ring-2 ring-indigo-500/35'
                            : 'border-slate-200/90 ring-slate-900/[0.03] hover:border-indigo-200/80 hover:ring-indigo-500/10'
                        }`}
                        style={{ animation: `slide-in 0.35s ease-out ${Math.min(idx, 12) * 45}ms both` }}
                      >
                        <span
                          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          aria-hidden
                        />
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80 transition-transform duration-200 group-hover:scale-105">
                          <ScrollText size={20} strokeWidth={2} aria-hidden />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col items-stretch justify-center gap-0.5">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="truncate text-[15px] font-semibold leading-snug text-slate-900">
                              {p.title || p.prompt_key}
                            </h3>
                            {tenantId && activeOverrideKeySet.has(p.prompt_key) && (
                              <span className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                                Overridden
                              </span>
                            )}
                          </div>
                          <p className="truncate font-mono text-[11px] text-slate-500" title={p.prompt_key}>
                            {p.prompt_key}
                          </p>
                        </div>
                        {selected ? (
                          <Check
                            className="mt-0.5 h-5 w-5 shrink-0 self-center text-indigo-600"
                            strokeWidth={2.5}
                            aria-label="Selected"
                          />
                        ) : (
                          <ChevronRight
                            size={20}
                            className="mt-0.5 shrink-0 self-center text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                            aria-hidden
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
