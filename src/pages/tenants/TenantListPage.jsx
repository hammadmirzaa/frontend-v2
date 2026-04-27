import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  RotateCcw,
  Users,
  Gauge,
  CalendarRange,
  ArrowRight,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../../hooks/useToast'
import config from '../../config'

const API_URL = config.API_URL

function maxUsersLabel(tenant) {
  const v = tenant?.config?.max_users
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? String(n) : '—'
}

export default function TenantListPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updating, setUpdating] = useState(false)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchTenants()
  }, [page, searchQuery])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      const response = await axios.get(`${API_URL}/api/tenants/`, { params })
      setTenants(response.data.items || [])
      setTotalPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
      showToast(error.response?.data?.detail || error.message || 'Failed to load tenants', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return
    setUpdating(true)
    try {
      await axios.delete(`${API_URL}/api/tenants/${tenant.id}`)
      showToast('Tenant deleted', 'success')
      fetchTenants()
    } catch (error) {
      showToast(error.response?.data?.detail || error.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleReactivateTenant = async (tenant) => {
    if (!window.confirm(`Reactivate tenant "${tenant.name}" and its users?`)) return
    setUpdating(true)
    try {
      await axios.post(`${API_URL}/api/tenants/${tenant.id}/reactivate`)
      showToast('Tenant reactivated', 'success')
      fetchTenants()
    } catch (error) {
      showToast(error.response?.data?.detail || error.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const TenantCardActions = ({ tenant, layout = 'row' }) => (
    <div
      className={
        layout === 'row'
          ? 'flex flex-wrap items-stretch gap-2'
          : 'flex flex-col gap-2'
      }
    >
      <button
        type="button"
        onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 ${layout === 'col' ? 'w-full' : ''}`}
      >
        <Settings size={16} strokeWidth={2} />
        Manage
        <ArrowRight size={16} className="opacity-80" strokeWidth={2} />
      </button>
      <div className="flex gap-2">
        {!tenant.is_active && (
          <button
            type="button"
            title="Reactivate tenant"
            onClick={() => handleReactivateTenant(tenant)}
            disabled={updating}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Reactivate
          </button>
        )}
        <button
          type="button"
          title="Delete tenant"
          onClick={() => handleDeleteTenant(tenant)}
          disabled={updating}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        {/* Hero — aligned with platform dashboard */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-7 text-white shadow-lg sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Super Admin</p>
              <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                <Building2 className="h-8 w-8 shrink-0 text-indigo-200" strokeWidth={1.75} />
                <span className="truncate">Tenants</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Organizations on the platform — open one to manage users, usage, subscription, and settings.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-sm">
                  <Users className="h-4 w-4 text-indigo-200" strokeWidth={2} />
                  <span className="text-slate-200">Total</span>
                  <span className="tabular-nums text-white">{total}</span>
                </span>
                {!loading && tenants.length > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
                    Showing <span className="font-semibold text-white">{tenants.length}</span> on this page
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/tenants/new')}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
            >
              <Plus size={20} strokeWidth={2} />
              Create tenant
            </button>
          </div>
        </div>

        {/* Search toolbar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/10 to-slate-300/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                <Search className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Directory</p>
                <p className="text-sm font-semibold text-slate-800">Find a tenant</p>
                <p className="mt-0.5 text-xs text-slate-500">Search by name or paste an organization ID.</p>
              </div>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search tenants…"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Tenant cards */}
        <div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              <p className="text-sm text-slate-500">Loading tenants…</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-slate-700">No tenants match your search</p>
              <p className="mt-1 text-sm text-slate-500">Try another term or create a new organization.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 opacity-[0.07]"
                    aria-hidden
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                        <Building2 className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}
                          className="block w-full truncate text-left text-lg font-bold text-slate-900 transition hover:text-indigo-700"
                        >
                          {tenant.name}
                        </button>
                        <p className="mt-1 truncate font-mono text-[11px] leading-tight text-slate-400" title={tenant.id}>
                          {tenant.id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        tenant.is_active
                          ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/60'
                          : 'bg-red-100 text-red-800 ring-1 ring-red-200/60'
                      }`}
                    >
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="relative mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 sm:px-3">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Users</span>
                      </div>
                      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{tenant.user_count ?? '—'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 sm:px-3">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Gauge className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Max</span>
                      </div>
                      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{maxUsersLabel(tenant)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 sm:px-3">
                      <div className="flex items-center gap-1 text-slate-400">
                        <CalendarRange className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Since</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-800 sm:text-xs">
                        {formatDate(tenant.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-5 border-t border-slate-100 pt-4">
                    <TenantCardActions tenant={tenant} layout="row" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-center text-sm text-slate-600 sm:text-left">
              Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex justify-center gap-2 sm:justify-end">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
