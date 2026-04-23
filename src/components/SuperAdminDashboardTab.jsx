import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  RefreshCw,
  Building2,
  Bot,
  Users,
  Wallet,
  MessageSquare,
  Library,
  CreditCard,
  TrendingUp,
  UserPlus,
  Inbox,
  CalendarClock,
  Activity,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import config from '../config'
import { cycleTableSort } from '../utils/tableSort'
import { getUsageMetricThemeById } from '../theme/usageMetrics'

const API_URL = config.API_URL

/** Align platform “Documents” KPI with global usage-metric visuals. */
const DOCUMENTS_USAGE_KPI = getUsageMetricThemeById('documents')

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '12 months' },
]

function formatLabel(key) {
  if (!key) return '—'
  return String(key)
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function formatNumber(n) {
  return new Intl.NumberFormat(undefined).format(Number(n) || 0)
}

function KpiCard({ icon: Icon, label, value, sub, accentClass = 'from-slate-600 to-slate-800' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${accentClass} opacity-[0.07]`}
        aria-hidden
      />
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentClass} text-white shadow-sm`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
      </div>
    </div>
  )
}

const STATUS_BAR = {
  ACTIVE: 'bg-emerald-500',
  TRIAL: 'bg-sky-500',
  PAST_DUE: 'bg-amber-500',
  CANCELED: 'bg-slate-400',
  EXPIRED: 'bg-rose-500',
}

const PLAN_BAR = {
  BASIC: 'bg-violet-500',
  PREMIUM: 'bg-indigo-600',
  ONE_TIME: 'bg-teal-500',
}

function DistributionBars({ title, data, barColors, emptyHint }) {
  const entries = useMemo(() => {
    return Object.entries(data || {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [data])

  const max = useMemo(() => Math.max(1, ...entries.map(([, c]) => c)), [entries])

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyHint}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map(([key, count]) => (
            <li key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-700">{formatLabel(key)}</span>
                <span className="tabular-nums text-slate-500">{formatNumber(count)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barColors[key] || 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 rounded-2xl bg-slate-200/80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200/70" />
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-slate-200/70" />
          <div className="h-40 rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminDashboardTab() {
  const [periodDays, setPeriodDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastLoaded, setLastLoaded] = useState(null)
  const [sort, setSort] = useState({ column: null, dir: null })

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_URL}/api/platform/dashboard-summary`, {
        params: { period_days: periodDays },
      })
      setData(res.data)
      setLastLoaded(new Date())
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load dashboard')
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [periodDays])

  useEffect(() => {
    load(false)
  }, [load])

  const formatMoney = (amount, currency) => {
    const n = Number(amount)
    if (Number.isNaN(n)) return '—'
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n)
    } catch {
      return `${currency || 'USD'} ${n.toFixed(2)}`
    }
  }

  const sortedTenants = useMemo(() => {
    if (!data?.tenants_by_chatbots) return []
    const rows = [...data.tenants_by_chatbots]
    const key = sort.column
    const dir = sort.dir
    if (!key || !dir) return rows
    const mult = dir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[key]
      const vb = b[key]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
      return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' }) * mult
    })
    return rows
  }, [data?.tenants_by_chatbots, sort])

  const toggleSort = (colKey) => {
    setSort((s) => cycleTableSort(colKey, s))
  }

  const SortBtn = ({ col, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-0.5 font-medium text-slate-600 hover:text-slate-900"
    >
      {children}
      {sort.column === col && sort.dir === 'asc' ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : sort.column === col && sort.dir === 'desc' ? (
        <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} aria-hidden />
      )}
    </button>
  )

  const activationRate =
    data && data.total_tenants > 0
      ? Math.round((data.active_tenants / data.total_tenants) * 1000) / 10
      : null

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-8 text-white shadow-lg sm:px-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Super Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Platform dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Operational overview across tenants, subscriptions, and product usage for the selected period.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="period">
              Reporting period
            </label>
            <select
              id="period"
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="text-slate-900">
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        {lastLoaded ? (
          <p className="relative mt-4 text-xs text-slate-400">
            Last updated {lastLoaded.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading && !data ? (
        <SkeletonDashboard />
      ) : data ? (
        <>
          {/* Primary KPIs */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Building2}
                label="Tenants"
                value={formatNumber(data.total_tenants)}
                sub={
                  activationRate != null
                    ? `${formatNumber(data.active_tenants)} active · ${formatNumber(data.inactive_tenants)} inactive · ${activationRate}% active`
                    : `${formatNumber(data.active_tenants)} active`
                }
                accentClass="from-sky-500 to-blue-700"
              />
              <KpiCard
                icon={Bot}
                label="Chatbots"
                value={formatNumber(data.total_chatbots)}
                sub={
                  data.deleted_chatbots > 0
                    ? `${formatNumber(data.deleted_chatbots)} archived (deleted)`
                    : 'Across all tenants'
                }
                accentClass="from-violet-500 to-purple-800"
              />
              <KpiCard
                icon={Users}
                label="Tenant users"
                value={formatNumber(data.total_tenant_users)}
                sub="Accounts linked to a tenant"
                accentClass="from-emerald-500 to-teal-800"
              />
              <KpiCard
                icon={Wallet}
                label="Paid in period"
                value={formatMoney(data.total_paid_amount, data.revenue_currency)}
                sub={`${formatNumber(data.paid_invoices_in_period)} paid invoices`}
                accentClass="from-amber-500 to-orange-700"
              />
            </div>
          </section>

          {/* Secondary — knowledge & engagement */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Knowledge & engagement
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Library}
                label="Libraries"
                value={formatNumber(data.total_libraries)}
                sub="Owned by tenant users"
                accentClass="from-cyan-500 to-slate-700"
              />
              <KpiCard
                icon={DOCUMENTS_USAGE_KPI.Icon}
                label="Documents"
                value={formatNumber(data.total_documents)}
                sub="Uploaded to knowledge bases"
                accentClass={DOCUMENTS_USAGE_KPI.gradientAccent}
              />
              <KpiCard
                icon={MessageSquare}
                label="Conversations"
                value={formatNumber(data.conversations_in_period)}
                sub={`~${formatNumber(data.avg_conversations_per_day)} / day avg`}
                accentClass="from-indigo-500 to-indigo-900"
              />
              <KpiCard
                icon={Activity}
                label="Messages"
                value={formatNumber(data.messages_in_period)}
                sub="Lead thread messages in period"
                accentClass="from-fuchsia-500 to-pink-800"
              />
            </div>
          </section>

          {/* Growth & pipeline */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Growth & pipeline</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={UserPlus}
                label="New tenants"
                value={formatNumber(data.new_tenants_in_period)}
                sub="Created in selected window"
                accentClass="from-green-500 to-emerald-900"
              />
              <KpiCard
                icon={Inbox}
                label="New leads"
                value={formatNumber(data.leads_in_period)}
                sub="Captured in period"
                accentClass="from-orange-500 to-red-800"
              />
              <KpiCard
                icon={CalendarClock}
                label="Follow-ups"
                value={formatNumber(data.followups_in_period)}
                sub="Created in period"
                accentClass="from-rose-500 to-rose-900"
              />
              <KpiCard
                icon={CreditCard}
                label="Active subscriptions"
                value={formatNumber(data.active_subscriptions)}
                sub="Status ACTIVE"
                accentClass="from-blue-600 to-slate-900"
              />
            </div>
          </section>

          {/* Table + side analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Tenants</h2>
                  <p className="text-xs text-slate-500">Users, chatbots, and conversation volume in this period.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Sort columns to compare
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3.5">
                        <SortBtn col="tenant_name">Tenant</SortBtn>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <SortBtn col="user_count">Users</SortBtn>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <SortBtn col="chatbot_count">Chatbots</SortBtn>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <SortBtn col="conversations_in_period">Conversations</SortBtn>
                      </th>
                      <th className="px-5 py-3.5 text-right w-28" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTenants.map((row) => (
                      <tr key={row.tenant_id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{row.tenant_name}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                          {formatNumber(row.user_count)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                          {formatNumber(row.chatbot_count)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                          {formatNumber(row.conversations_in_period)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/dashboard/tenants/${row.tenant_id}`}
                            className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <DistributionBars
                title="Subscriptions by status"
                data={data.subscription_by_status}
                barColors={STATUS_BAR}
                emptyHint="No subscription rows yet."
              />
              <DistributionBars
                title="Plans in use"
                data={data.subscription_by_plan}
                barColors={PLAN_BAR}
                emptyHint="No plan data yet."
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
