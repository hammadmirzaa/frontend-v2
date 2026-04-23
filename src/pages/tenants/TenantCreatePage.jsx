import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { useToast } from '../../hooks/useToast'
import config from '../../config'

const API_URL = config.API_URL

export default function TenantCreatePage() {
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [name, setName] = useState('')
  const [maxUsers, setMaxUsers] = useState('')
  const [includeAdmin, setIncludeAdmin] = useState(true)
  const [adminFullName, setAdminFullName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('Tenant name is required', 'error')
      return
    }
    const maxUsersNum = maxUsers.trim() === '' ? undefined : parseInt(maxUsers, 10)
    if (maxUsers.trim() !== '' && (!Number.isFinite(maxUsersNum) || maxUsersNum < 1)) {
      showToast('Max users must be a positive integer or empty', 'error')
      return
    }
    if (includeAdmin) {
      if (!adminEmail.trim() || !adminPassword.trim()) {
        showToast('Initial Admin requires email and password', 'error')
        return
      }
      if (maxUsersNum != null && maxUsersNum < 1) {
        showToast('Set max users to at least 1 when creating an initial Admin', 'error')
        return
      }
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        ...(maxUsersNum != null ? { max_users: maxUsersNum } : {}),
        ...(includeAdmin
          ? {
              initial_admin: {
                email: adminEmail.trim(),
                password: adminPassword,
                full_name: adminFullName.trim() || undefined,
              },
            }
          : {}),
      }
      const { data } = await axios.post(`${API_URL}/api/tenants/`, body)
      showToast('Tenant created', 'success')
      navigate(`/dashboard/tenants/${data.id}`)
    } catch (error) {
      showToast(error.response?.data?.detail || error.message || 'Failed to create tenant', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-7 text-white shadow-lg sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"
            aria-hidden
          />
          <Link
            to="/dashboard/tenants"
            className="relative inline-flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            All tenants
          </Link>
          <h1 className="relative mt-4 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <Building2 className="h-8 w-8 shrink-0 text-indigo-200" strokeWidth={1.75} />
            Create tenant
          </h1>
          <p className="relative mt-2 max-w-xl text-sm text-slate-300">
            Optionally set a user cap and create the first Admin for this tenant.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenant name *</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max users (optional)</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="No limit"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Total users allowed in the tenant. Leave empty for no cap.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAdmin}
                  onChange={(e) => setIncludeAdmin(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                />
                <span className="text-sm font-semibold text-slate-900">Create initial Admin (recommended)</span>
              </label>
              {includeAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin full name</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin email *</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin password *</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Role is fixed to Admin and the user is linked to the new tenant.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <Link
                to="/dashboard/tenants"
                className="inline-flex justify-center rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:min-w-[160px]"
              >
                {saving ? 'Creating…' : 'Create tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
