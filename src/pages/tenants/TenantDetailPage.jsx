import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  ScrollText,
  UserPlus,
  Users,
  Shield,
  Briefcase,
  X,
  AlertTriangle,
  SlidersHorizontal,
  Pencil,
  List,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../../hooks/useToast'
import config from '../../config'
import SubscriptionTab from '../../components/SubscriptionTab'
import BasicUsageSummary from '../../components/BasicUsageSummary'
import { getUsageMetricTheme } from '../../theme/usageMetrics'

const API_URL = config.API_URL

function formatApiDetail(detail) {
  if (detail == null) return 'Something went wrong.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'object' && item?.msg ? item.msg : JSON.stringify(item)))
      .join(' ')
  }
  if (typeof detail === 'object' && detail?.msg) return String(detail.msg)
  return String(detail)
}

function detailFromAxiosError(err) {
  const d = err?.response?.data?.detail
  return formatApiDetail(d) || err?.message || 'Something went wrong.'
}

/**
 * Parse seat-limit conflicts from PUT /tenants/:id/config (tolerant of trailing text / spacing).
 */
function parseSeatLimitConflict(detailStr) {
  if (!detailStr || typeof detailStr !== 'string') return null
  const s = detailStr.replace(/\s+/g, ' ').trim()

  const ms = s.match(
    /Manager\s*[/\\]\s*Sales\s+seat\s+limit\s*\((\d+)\)\s+cannot\s+be\s+below\s+the\s+current\s+Manager\s*[/\\]\s*Sales\s+user\s+count\s*\((\d+)\)/i
  )
  if (ms) {
    return { kind: 'manager_sales', limit: parseInt(ms[1], 10), current: parseInt(ms[2], 10) }
  }
  const ad = s.match(
    /Admin\s+seat\s+limit\s*\((\d+)\)\s+cannot\s+be\s+below\s+the\s+current\s+Admin\s+user\s+count\s*\((\d+)\)/i
  )
  if (ad) {
    return { kind: 'admin', limit: parseInt(ad[1], 10), current: parseInt(ad[2], 10) }
  }
  return null
}

/** Block save before API: seat caps must be >= existing users in those roles. */
function validateSeatLimitsVsHeadcount(adminSeats, msSeats, adminCount, managerSalesCount) {
  if (adminSeats < adminCount) {
    return { kind: 'admin', limit: adminSeats, current: adminCount }
  }
  if (msSeats < managerSalesCount) {
    return { kind: 'manager_sales', limit: msSeats, current: managerSalesCount }
  }
  return null
}

function buildSeatLimitAlert(conflict, rawServerDetail) {
  if (conflict?.kind === 'manager_sales') {
    return {
      title: 'Manager and Sales seat limit is too low',
      summary: `This organization already has ${conflict.current} user(s) with the Manager or Sales role. Raise “Manager / Sales seats allowed” to at least ${conflict.current} before saving, or remove or reassign those users.`,
      technicalDetail: rawServerDetail || null,
      applyMin: { field: 'manager_sales', value: conflict.current },
    }
  }
  if (conflict?.kind === 'admin') {
    return {
      title: 'Admin seat limit is too low',
      summary: `This organization already has ${conflict.current} Admin user(s). Raise “Admin seats allowed” to at least ${conflict.current} before saving, or remove an Admin account.`,
      technicalDetail: rawServerDetail || null,
      applyMin: { field: 'admin', value: conflict.current },
    }
  }
  return {
    title: 'Settings could not be saved',
    summary:
      'Your changes were not applied. Check your connection and try again. If the issue continues, open Technical details and share them with support.',
    technicalDetail: rawServerDetail || null,
    applyMin: null,
  }
}

/** Parse seat limit input; empty uses fallback (typically saved cap). */
function parseSeatInput(raw, fallback) {
  const t = String(raw ?? '').trim()
  if (t === '') return fallback
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? Math.max(0, n) : fallback
}

function userInitials(user) {
  const n = (user?.full_name || user?.email || '?').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return n.slice(0, 2).toUpperCase() || '?'
}

function roleBadgeClass(role) {
  const r = String(role || '').toUpperCase()
  if (r === 'ADMIN') return 'bg-violet-100 text-violet-900 ring-1 ring-violet-200/80'
  if (r === 'MANAGER') return 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80'
  if (r === 'SALES') return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80'
  return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/80'
}

export default function TenantDetailPage() {
  const { tenantId } = useParams()
  const { showToast, ToastContainer } = useToast()

  const [tab, setTab] = useState('users')
  const [dashboard, setDashboard] = useState(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [tenant, setTenant] = useState(null)
  const [updating, setUpdating] = useState(false)

  const [settingsName, setSettingsName] = useState('')
  const [settingsTenantActive, setSettingsTenantActive] = useState(true)
  const [settingsMaxUsers, setSettingsMaxUsers] = useState('')
  const [settingsAdminSeatsLimit, setSettingsAdminSeatsLimit] = useState('1')
  const [settingsManagerSalesSeatsLimit, setSettingsManagerSalesSeatsLimit] = useState('1')

  const [createModalMode, setCreateModalMode] = useState(null) // null | 'admin' | 'staff'
  const [acctFullName, setAcctFullName] = useState('')
  const [acctEmail, setAcctEmail] = useState('')
  const [acctPassword, setAcctPassword] = useState('')
  const [acctRole, setAcctRole] = useState('MANAGER')
  const [acctSaving, setAcctSaving] = useState(false)

  const [editUser, setEditUser] = useState(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  /** Global notice (seat limits, save failures) — shown below tabs on all pages */
  const [tenantSaveAlert, setTenantSaveAlert] = useState(null)
  const [tenantSaveAlertShowTechnical, setTenantSaveAlertShowTechnical] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setDashLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/tenants/${tenantId}/dashboard`)
      setDashboard(res.data)
      const t = res.data.tenant
      setTenant(t)
      setSettingsName(t?.name || '')
      setSettingsTenantActive(Boolean(t?.is_active))
      const cap = t?.config?.max_users
      setSettingsMaxUsers(cap != null && cap !== '' ? String(cap) : '')
      const ul = t?.config?.usage_limits || {}
      const au = ul.admin_users
      setSettingsAdminSeatsLimit(
        au && au.limit !== undefined && au.limit !== null ? String(au.limit) : '1'
      )
      const ac = ul.admin_created_users
      setSettingsManagerSalesSeatsLimit(
        ac && ac.limit !== undefined && ac.limit !== null ? String(ac.limit) : '1'
      )
    } catch (e) {
      console.error(e)
      showToast(e.response?.data?.detail || 'Failed to load tenant', 'error')
      setDashboard(null)
    } finally {
      setDashLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount) => {
    if (amount == null) return '$0.00'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const handleTenantActiveToggle = async () => {
    if (!tenant) return
    const next = !settingsTenantActive
    setUpdating(true)
    try {
      await axios.put(`${API_URL}/api/tenants/${tenantId}`, { is_active: next })
      setSettingsTenantActive(next)
      showToast('Tenant status updated', 'success')
      fetchDashboard()
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const clearTenantSaveAlert = () => {
    setTenantSaveAlert(null)
    setTenantSaveAlertShowTechnical(false)
  }

  const applySeatMinimumFromAlert = () => {
    const apply = tenantSaveAlert?.applyMin
    if (!apply) return
    if (apply.field === 'manager_sales') {
      setSettingsManagerSalesSeatsLimit(String(apply.value))
    } else {
      setSettingsAdminSeatsLimit(String(apply.value))
    }
    clearTenantSaveAlert()
    setTab('settings')
    showToast(`Seat limit set to ${apply.value}. Click "Save settings" to apply.`, 'info', 8000)
  }

  const handleSaveSettings = async () => {
    if (!settingsName.trim()) {
      showToast('Name required', 'error')
      return
    }
    clearTenantSaveAlert()
    setUpdating(true)
    try {
      const mu = settingsMaxUsers.trim() === '' ? 0 : parseInt(settingsMaxUsers, 10)
      if (settingsMaxUsers.trim() !== '' && (!Number.isFinite(mu) || mu < 0)) {
        showToast('Max users must be empty (unlimited) or a non-negative integer', 'error')
        setUpdating(false)
        return
      }

      const adminSeats = parseInt(settingsAdminSeatsLimit.trim(), 10)
      const msSeats = parseInt(settingsManagerSalesSeatsLimit.trim(), 10)
      if (!Number.isFinite(adminSeats) || adminSeats < 0) {
        showToast('Admin seat limit must be a non-negative integer', 'error')
        setUpdating(false)
        return
      }
      if (!Number.isFinite(msSeats) || msSeats < 0) {
        showToast('Manager/Sales seat limit must be a non-negative integer', 'error')
        setUpdating(false)
        return
      }

      const users = dashboard?.users || []
      const adminCountNow = users.filter((u) => u.role === 'ADMIN').length
      const managerSalesCountNow = users.filter((u) => u.role === 'MANAGER' || u.role === 'SALES').length
      const localConflict = validateSeatLimitsVsHeadcount(
        adminSeats,
        msSeats,
        adminCountNow,
        managerSalesCountNow
      )
      if (localConflict) {
        setTenantSaveAlert(buildSeatLimitAlert(localConflict))
        setTenantSaveAlertShowTechnical(false)
        setTab('settings')
        setUpdating(false)
        return
      }

      await axios.put(`${API_URL}/api/tenants/${tenantId}`, {
        name: settingsName.trim(),
        is_active: settingsTenantActive,
        max_users: settingsMaxUsers.trim() === '' ? 0 : mu,
      })

      await axios.put(`${API_URL}/api/tenants/${tenantId}/config`, {
        usage_limits: {
          admin_users: { limit: adminSeats },
          admin_created_users: { limit: msSeats },
        },
      })

      showToast('Settings saved', 'success')
      fetchDashboard()
    } catch (e) {
      const raw = detailFromAxiosError(e)
      const conflict = parseSeatLimitConflict(raw)
      setTenantSaveAlert(buildSeatLimitAlert(conflict || undefined, raw))
      setTenantSaveAlertShowTechnical(false)
      setTab('settings')

      try {
        await fetchDashboard()
      } catch {
        /* ignore refetch errors after failed save */
      }
    } finally {
      setUpdating(false)
    }
  }

  const resetCreateAccountForm = () => {
    setAcctFullName('')
    setAcctEmail('')
    setAcctPassword('')
    setAcctRole('MANAGER')
  }

  const openCreateModal = (mode) => {
    resetCreateAccountForm()
    setCreateModalMode(mode)
  }

  const submitCreateAccount = async () => {
    if (!acctEmail.trim() || !acctPassword.trim()) {
      showToast('Email and password are required', 'error')
      return
    }
    setAcctSaving(true)
    try {
      if (createModalMode === 'admin') {
        await axios.post(`${API_URL}/api/tenants/${tenantId}/admins`, {
          email: acctEmail.trim(),
          password: acctPassword,
          full_name: acctFullName.trim() || undefined,
        })
      } else if (createModalMode === 'staff') {
        await axios.post(`${API_URL}/api/tenants/${tenantId}/users`, {
          email: acctEmail.trim(),
          password: acctPassword,
          full_name: acctFullName.trim() || undefined,
          role: acctRole,
        })
      } else {
        return
      }
      showToast('Account created', 'success')
      setCreateModalMode(null)
      resetCreateAccountForm()
      fetchDashboard()
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setAcctSaving(false)
    }
  }

  const handleUserActive = async (userId, next) => {
    setUpdating(true)
    try {
      await axios.patch(`${API_URL}/api/auth/users/${userId}/status`, { is_active: next })
      showToast(next ? 'Activated' : 'Deactivated', 'success')
      fetchDashboard()
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditFullName(u.full_name || '')
    setEditEmail(u.email || '')
  }

  const saveEdit = async () => {
    if (!editUser) return
    setUpdating(true)
    try {
      await axios.patch(`${API_URL}/api/auth/users/${editUser.id}`, {
        full_name: editFullName.trim() || null,
        email: editEmail.trim(),
        role: editUser.role,
      })
      showToast('User updated', 'success')
      setEditUser(null)
      fetchDashboard()
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const tenantUsers = dashboard?.users || []
  const cap = dashboard?.max_users
  const count = dashboard?.user_count ?? 0
  const adminCount = tenantUsers.filter((u) => u.role === 'ADMIN').length
  const managerSalesCount = tenantUsers.filter((u) => u.role === 'MANAGER' || u.role === 'SALES').length
  const ul = tenant?.config?.usage_limits || {}
  const adminSeatCap =
    ul.admin_users && ul.admin_users.limit !== undefined && ul.admin_users.limit !== null
      ? Number(ul.admin_users.limit)
      : 1
  const managerSalesSeatCap =
    ul.admin_created_users &&
    ul.admin_created_users.limit !== undefined &&
    ul.admin_created_users.limit !== null
      ? Number(ul.admin_created_users.limit)
      : 1
  const canCreateAdmin = adminCount < adminSeatCap
  const canCreateStaff = managerSalesCount < managerSalesSeatCap

  const adminAllowedDraft = parseSeatInput(settingsAdminSeatsLimit, adminSeatCap)
  const managerSalesAllowedDraft = parseSeatInput(settingsManagerSalesSeatsLimit, managerSalesSeatCap)
  const adminSeatBarPct =
    adminAllowedDraft > 0
      ? Math.min(100, (adminCount / adminAllowedDraft) * 100)
      : adminCount > 0
        ? 100
        : 0
  const managerSalesBarPct =
    managerSalesAllowedDraft > 0
      ? Math.min(100, (managerSalesCount / managerSalesAllowedDraft) * 100)
      : managerSalesCount > 0
        ? 100
        : 0
  const adminOverCap = adminCount > adminAllowedDraft
  const managerSalesOverCap = managerSalesCount > managerSalesAllowedDraft

  const maxUsersTrimmed = settingsMaxUsers.trim()
  const maxUsersParsed = maxUsersTrimmed === '' ? null : parseInt(maxUsersTrimmed, 10)
  const draftMaxUsersCap =
    maxUsersTrimmed !== '' && Number.isFinite(maxUsersParsed) && maxUsersParsed > 0 ? maxUsersParsed : null
  const usersOverOrgCap = draftMaxUsersCap != null && count > draftMaxUsersCap
  const orgUserCapBarPct =
    draftMaxUsersCap != null && draftMaxUsersCap > 0
      ? Math.min(100, (count / draftMaxUsersCap) * 100)
      : count > 0
        ? 100
        : 0

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'queries', label: 'Queries / usage' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'tracking', label: 'Tracking / logs' },
    { id: 'settings', label: 'Tenant settings' },
  ]

  return (
    <>
      <ToastContainer />
      <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-4 pb-8 sm:gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-6 text-white shadow-lg sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                to="/dashboard/tenants"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white"
              >
                <ArrowLeft size={16} strokeWidth={2} />
                All tenants
              </Link>
              <h1 className="mt-3 flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                <Building2 className="h-8 w-8 shrink-0 text-indigo-200" strokeWidth={1.75} />
                <span className="min-w-0 break-words">{dashLoading ? 'Loading…' : tenant?.name || 'Tenant'}</span>
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Users: <strong className="text-white">{count}</strong>
                {cap != null && cap > 0 ? (
                  <>
                    {' '}
                    / <strong className="text-white">{cap}</strong> max
                  </>
                ) : (
                  <span className="text-slate-400"> · No max_users cap</span>
                )}
              </p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm sm:justify-start">
              <span className="text-sm font-medium text-white">Tenant active</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-2 focus:ring-indigo-400/50"
                checked={settingsTenantActive}
                onChange={() => handleTenantActiveToggle()}
                disabled={updating || dashLoading}
              />
            </label>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <div className="flex min-w-min gap-0.5 px-2 py-2 sm:px-4">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                      tab === t.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        {tenantSaveAlert && (
          <div className="border-b border-slate-100 px-4 pt-4 sm:px-6" role="alert">
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-950 tracking-tight">{tenantSaveAlert.title}</p>
                <p className="mt-2 leading-relaxed text-amber-900">{tenantSaveAlert.summary}</p>
                {tenantSaveAlert.applyMin && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={applySeatMinimumFromAlert}
                      className="inline-flex items-center rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-900"
                    >
                      Set seat limit to {tenantSaveAlert.applyMin.value}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('settings')}
                      className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100/80"
                    >
                      Tenant settings
                    </button>
                  </div>
                )}
                {tenantSaveAlert.technicalDetail ? (
                  <div className="mt-4 border-t border-amber-200/80 pt-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-amber-900 underline decoration-amber-600/60 hover:decoration-amber-900"
                      onClick={() => setTenantSaveAlertShowTechnical((v) => !v)}
                      aria-expanded={tenantSaveAlertShowTechnical}
                    >
                      {tenantSaveAlertShowTechnical ? 'Hide technical details' : 'Show technical details'}
                    </button>
                    {tenantSaveAlertShowTechnical && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-white/80 p-3 text-xs text-gray-800 ring-1 ring-amber-200/60 whitespace-pre-wrap break-words">
                        {tenantSaveAlert.technicalDetail}
                      </pre>
                    )}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mt-4 text-sm font-medium text-amber-900/90 underline hover:text-amber-950"
                  onClick={clearTenantSaveAlert}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === 'users' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                    <Users className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Users and admins</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Seat caps and roles for this organization. Use Tenant settings to change limits.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openCreateModal('admin')}
                    disabled={!canCreateAdmin}
                    title={
                      canCreateAdmin
                        ? 'Create a tenant Admin (super admin only)'
                        : `Admin seats full (${adminCount}/${adminSeatCap}). Increase limit in Tenant settings.`
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <UserPlus size={18} />
                    Create tenant admin
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateModal('staff')}
                    disabled={!canCreateStaff}
                    title={
                      canCreateStaff
                        ? 'Create a Manager or Sales user'
                        : `Manager/Sales seats full (${managerSalesCount}/${managerSalesSeatCap}). Increase limit in Tenant settings.`
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <UserPlus size={18} />
                    Create Manager / Sales
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Tenant <strong>Admin</strong> is created here (seat cap: {adminCount}/{adminSeatCap}).{' '}
                <strong>Manager</strong> and <strong>Sales</strong> use the other action (seat cap:{' '}
                {managerSalesCount}/{managerSalesSeatCap}). Adjust caps in the <strong>Tenant settings</strong> tab.
              </p>
              {dashLoading ? (
                <p className="text-slate-500">Loading…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 opacity-[0.1]" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                          <Users className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
                          <p className="text-xl font-bold tabular-nums text-slate-900">{count}</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-800 opacity-[0.1]" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-800 text-white shadow-sm">
                          <Shield className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admins</p>
                          <p className="text-xl font-bold tabular-nums text-slate-900">
                            {adminCount}
                            <span className="text-sm font-semibold text-slate-500">/{adminSeatCap}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 opacity-[0.1]" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                          <Briefcase className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manager / Sales</p>
                          <p className="text-xl font-bold tabular-nums text-slate-900">
                            {managerSalesCount}
                            <span className="text-sm font-semibold text-slate-500">/{managerSalesSeatCap}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-800 opacity-[0.1]" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-800 text-white shadow-sm">
                          <Building2 className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max users cap</p>
                          <p className="text-xl font-bold tabular-nums text-slate-900">
                            {cap != null && cap > 0 ? cap : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 md:hidden">
                    {tenantUsers.map((u) => (
                      <li
                        key={u.id}
                        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                      >
                        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-slate-700 opacity-[0.07]" />
                        <div className="relative flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-sm font-bold text-white shadow-sm">
                            {userInitials(u)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{u.full_name || '—'}</p>
                            <p className="truncate text-sm text-slate-600">{u.email}</p>
                            <span
                              className={`mt-2 inline-flex rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleBadgeClass(u.role)}`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <label className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Active
                            </span>
                            <input
                              type="checkbox"
                              checked={Boolean(u.is_active)}
                              onChange={(e) => handleUserActive(u.id, e.target.checked)}
                              disabled={updating}
                              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4 text-slate-600" strokeWidth={2} />
                          Edit account
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="relative hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md md:block">
                    <div
                      className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/12 to-slate-600/10 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/95 to-white px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                            <List className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Directory</p>
                            <p className="text-base font-bold text-slate-900">All accounts</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {count === 1 ? '1 person' : `${count} people`} in this organization
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tabular-nums text-slate-700 shadow-sm">
                          {count} listed
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                            <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6">
                              Name
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6">
                              Email
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6">
                              Role
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6">
                              Active
                            </th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tenantUsers.map((u) => (
                            <tr
                              key={u.id}
                              className="group transition-colors hover:bg-indigo-50/40"
                            >
                              <td className="px-5 py-3.5 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-xs font-bold text-white shadow-sm">
                                    {userInitials(u)}
                                  </div>
                                  <span className="font-semibold text-slate-900">{u.full_name || '—'}</span>
                                </div>
                              </td>
                              <td className="max-w-[220px] truncate px-5 py-3.5 text-slate-600 sm:px-6" title={u.email}>
                                {u.email}
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                <span
                                  className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${roleBadgeClass(u.role)}`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.is_active)}
                                  onChange={(e) => handleUserActive(u.id, e.target.checked)}
                                  disabled={updating}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30"
                                />
                              </td>
                              <td className="px-5 py-3.5 text-right sm:px-6">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-900"
                                  onClick={() => openEdit(u)}
                                >
                                  <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'queries' && (
            <div>
              {dashLoading ? (
                <p className="text-gray-500">Loading…</p>
              ) : dashboard?.basic_usage ? (
                <BasicUsageSummary basicUsage={dashboard.basic_usage} title="Usage" />
              ) : !dashboard?.usage_summary?.usage ? (
                <p className="text-slate-500">No subscription usage data.</p>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Billing period</p>
                        {dashboard.usage_summary.period_start && (
                          <p className="mt-1 text-sm font-semibold text-sky-950">
                            {formatDate(dashboard.usage_summary.period_start)} —{' '}
                            {formatDate(dashboard.usage_summary.period_end)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(dashboard.usage_summary.usage).map(([key, val]) => {
                      const t = getUsageMetricTheme(key)
                      const Icon = t.Icon
                      const accent = t.gradientAccent
                      return (
                        <div
                          key={key}
                          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                        >
                          <div
                            className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-[0.1]`}
                          />
                          <div className="relative mb-3 flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
                            >
                              <Icon className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <h4 className="text-sm font-bold capitalize text-slate-900">{key.replace(/_/g, ' ')}</h4>
                          </div>
                          {typeof val === 'object' && val != null ? (
                            <dl className="space-y-2 text-sm">
                              {Object.entries(val).map(([ik, iv]) => (
                                <div
                                  key={ik}
                                  className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                                >
                                  <dt className="capitalize text-slate-500">{ik.replace(/_/g, ' ')}</dt>
                                  <dd className="font-semibold tabular-nums text-slate-900">{String(iv)}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="text-lg font-bold tabular-nums text-slate-900">{String(val)}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'subscription' && (
            <SubscriptionTab tenantId={tenantId} tenantName={tenant?.name} onTenantSubscriptionChanged={fetchDashboard} />
          )}

          {tab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-800 text-white shadow-sm">
                  <ScrollText className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tracking / logs</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Recent conversation sessions for this tenant (session id, source, last activity).
                  </p>
                </div>
              </div>
              {dashLoading ? (
                <p className="text-slate-500">Loading…</p>
              ) : !dashboard?.recent_sessions?.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
                  No recent sessions.
                </div>
              ) : (
                <>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                    <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-800 opacity-[0.08]" />
                    <div className="relative flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions shown</p>
                        <p className="text-2xl font-bold tabular-nums text-slate-900">
                          {dashboard.recent_sessions.length}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 sm:ml-auto sm:max-w-md sm:text-right">
                        Newest entries appear first in the list below.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3 md:hidden">
                    {dashboard.recent_sessions.map((s) => (
                      <li
                        key={s.session_id}
                        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                      >
                        <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-800 opacity-[0.06]" />
                        <div className="relative space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session</p>
                          <p className="break-all font-mono text-xs text-slate-900">{s.session_id}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>
                              <span className="text-slate-500">Source </span>
                              <span className="font-medium text-slate-800">{s.source || '—'}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Last access{' '}
                            <span className="font-medium text-slate-700">
                              {formatDate(s.last_accessed_at || s.created_at)}
                            </span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden max-h-[min(480px,70vh)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
                    <div className="overflow-y-auto overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Session
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Source
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Last access
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dashboard.recent_sessions.map((s) => (
                            <tr key={s.session_id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 font-mono text-xs text-slate-800">{s.session_id}</td>
                              <td className="px-4 py-3 text-slate-700">{s.source || '—'}</td>
                              <td className="px-4 py-3 text-slate-700">
                                {formatDate(s.last_accessed_at || s.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="w-full max-w-7xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tenant settings</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Identity, capacity, and seat caps for this organization.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-sky-200/70 bg-white p-5 shadow-md sm:p-6">
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-700/10 blur-2xl"
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/90 via-white to-white" />
                <div className="relative z-0 flex min-h-0 flex-1 flex-col">
                  <div className="mb-5 flex flex-col gap-3 border-b border-sky-100/90 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-md">
                        <Building2 className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">General</h4>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Organization name and optional org-wide user ceiling.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 opacity-[0.07]"
                        aria-hidden
                      />
                      <div className="relative flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                          <Building2 className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identity</p>
                          <p className="text-sm font-bold text-slate-900">Tenant name</p>
                        </div>
                      </div>
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Display name
                      </label>
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-inner focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        value={settingsName}
                        onChange={(e) => {
                          clearTenantSaveAlert()
                          setSettingsName(e.target.value)
                        }}
                      />
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Shown across the admin experience, billing, and tenant-facing surfaces.
                      </p>
                    </div>

                    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 opacity-[0.07]"
                        aria-hidden
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                            <Users className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity</p>
                            <p className="text-sm font-bold text-slate-900">Max users (org)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {draftMaxUsersCap != null ? (
                            <>
                              <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">
                                {count}
                                <span className="text-base font-semibold text-slate-400">/</span>
                                <span className="text-lg font-bold text-slate-700">{draftMaxUsersCap}</span>
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-slate-500">seats in use · cap</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">{count}</p>
                              <p className="mt-1 text-[11px] font-medium text-slate-500">users · no org cap</p>
                            </>
                          )}
                        </div>
                      </div>
                      {draftMaxUsersCap != null && (
                        <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usersOverOrgCap ? 'bg-red-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${orgUserCapBarPct}%` }}
                          />
                        </div>
                      )}
                      {usersOverOrgCap && (
                        <p className="mt-2 text-xs font-medium text-red-700">
                          Cap is below current headcount — raise max users or remove accounts before saving.
                        </p>
                      )}
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        User ceiling
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1.5 w-full max-w-[11rem] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900 shadow-inner focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Unlimited"
                        value={settingsMaxUsers}
                        onChange={(e) => {
                          clearTenantSaveAlert()
                          setSettingsMaxUsers(e.target.value)
                        }}
                      />
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Leave empty or use <span className="font-medium text-slate-700">0</span> for no cap. Save to
                        apply.
                      </p>
                    </div>
                  </div>
                </div>
                </div>

                <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-violet-200/70 bg-white p-5 shadow-md sm:p-6">
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/15 to-purple-600/10 blur-2xl"
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50/80 via-white to-white" />
                  <div className="relative z-0 flex min-h-0 flex-1 flex-col">
                    <div className="mb-5 flex flex-col gap-3 border-b border-violet-100/90 pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-md">
                          <SlidersHorizontal className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Role seat limits</h4>
                          <p className="text-xs text-slate-600 sm:text-sm">
                            Caps must be at least as high as users already in each role.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                      {/* Admin seats */}
                      <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-violet-500 to-purple-800 opacity-[0.07]"
                        aria-hidden
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-800 text-white shadow-sm">
                            <Shield className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
                            <p className="text-sm font-bold text-slate-900">Tenant admin seats</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">
                            {adminCount}
                            <span className="text-base font-semibold text-slate-400">/</span>
                            <span className="text-lg font-bold text-slate-700">{adminAllowedDraft}</span>
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-500">in use · allowed</p>
                        </div>
                      </div>
                      <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${adminOverCap ? 'bg-red-500' : 'bg-violet-600'}`}
                          style={{ width: `${adminSeatBarPct}%` }}
                        />
                      </div>
                      {adminOverCap && (
                        <p className="mt-2 text-xs font-medium text-red-700">
                          Allowed seats are below current admins — raise the limit or remove an admin before saving.
                        </p>
                      )}
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Seats allowed
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1.5 w-full max-w-[11rem] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900 shadow-inner focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        value={settingsAdminSeatsLimit}
                        onChange={(e) => {
                          clearTenantSaveAlert()
                          setSettingsAdminSeatsLimit(e.target.value)
                        }}
                      />
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Counts tenant <span className="font-medium text-slate-700">Admin</span> role only.
                      </p>
                    </div>

                    {/* Manager / Sales seats */}
                    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 opacity-[0.07]"
                        aria-hidden
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                            <Briefcase className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manager / Sales</p>
                            <p className="text-sm font-bold text-slate-900">Staff seats</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">
                            {managerSalesCount}
                            <span className="text-base font-semibold text-slate-400">/</span>
                            <span className="text-lg font-bold text-slate-700">{managerSalesAllowedDraft}</span>
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-500">in use · allowed</p>
                        </div>
                      </div>
                      <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            managerSalesOverCap ? 'bg-red-500' : 'bg-sky-600'
                          }`}
                          style={{ width: `${managerSalesBarPct}%` }}
                        />
                      </div>
                      {managerSalesOverCap && (
                        <p className="mt-2 text-xs font-medium text-red-700">
                          Allowed seats are below current staff — raise the limit or reassign users before saving.
                        </p>
                      )}
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Seats allowed
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1.5 w-full max-w-[11rem] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900 shadow-inner focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        value={settingsManagerSalesSeatsLimit}
                        onChange={(e) => {
                          clearTenantSaveAlert()
                          setSettingsManagerSalesSeatsLimit(e.target.value)
                        }}
                      />
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Tenant admins add these from their portal within this cap.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-sm sm:p-6">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Tenant active</span>
                    <p className="mt-0.5 text-xs text-slate-500">Inactive tenants cannot sign in.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                    checked={settingsTenantActive}
                    onChange={(e) => {
                      clearTenantSaveAlert()
                      setSettingsTenantActive(e.target.checked)
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={handleSaveSettings}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
              >
                Save settings
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setEditUser(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
            role="dialog"
            aria-labelledby="edit-user-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50/95 via-white to-white px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                  <Pencil className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 id="edit-user-title" className="text-lg font-bold text-slate-900">
                    Edit user
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">Update the display name and email for this account.</p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
                onClick={() => setEditUser(null)}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-user-fullname" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Full name
                  </label>
                  <input
                    id="edit-user-fullname"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    id="edit-user-email"
                    type="email"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
                onClick={saveEdit}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {createModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">
                {createModalMode === 'admin' ? 'Create tenant admin' : 'Create Manager / Sales'}
              </h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setCreateModalMode(null)
                  resetCreateAccountForm()
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {createModalMode === 'admin'
                ? 'Creates one tenant Admin account. Use Tenant settings to allow more than one Admin seat if needed.'
                : 'Creates a Manager or Sales user. The tenant Admin can also create these roles from their dashboard (within the seat cap).'}
            </p>
            <div className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Full name"
                value={acctFullName}
                onChange={(e) => setAcctFullName(e.target.value)}
              />
              <input
                className="w-full border rounded-lg px-3 py-2"
                type="email"
                placeholder="Email"
                value={acctEmail}
                onChange={(e) => setAcctEmail(e.target.value)}
              />
              <input
                className="w-full border rounded-lg px-3 py-2"
                type="password"
                placeholder="Password"
                value={acctPassword}
                onChange={(e) => setAcctPassword(e.target.value)}
              />
              {createModalMode === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={acctRole} onChange={(e) => setAcctRole(e.target.value)}>
                    <option value="MANAGER">MANAGER</option>
                    <option value="SALES">SALES</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg"
                onClick={() => {
                  setCreateModalMode(null)
                  resetCreateAccountForm()
                }}
              >
                Cancel
              </button>
              <button type="button" className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50" onClick={submitCreateAccount} disabled={acctSaving}>
                {acctSaving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
