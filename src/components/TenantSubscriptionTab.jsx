import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  CreditCard,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
  Download,
  Edit,
  X,
  Check,
  KeyRound,
  Package,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import config from '../config'
import {
  getUsageMetricTheme,
  formatUsageMetricNumber,
  normalizeUsageMetricKey,
  USAGE_METRIC_BASIC_ROWS,
} from '../theme/usageMetrics'
import { cn } from '../utils/cn'
import { cycleTableSort } from '../utils/tableSort'
import { Button, SearchInput, Table, Pagination } from './ui'

const API_URL = config.API_URL

const METRIC_SUBTITLE = {
  ai_queries: '(AI Chatbot Queries)',
  AI_QUERIES: '(AI Chatbot Queries)',
  documents: '(Document Intelligence)',
  DOCUMENTS: '(Document Intelligence)',
  emails: '(Email Follow-Ups)',
  EMAILS: '(Email Follow-Ups)',
  sms: '(SMS Follow-Ups)',
  SMS: '(SMS Follow-Ups)',
  storage: '(Storage - 5GB)',
  STORAGE: '(Storage - 5GB)',
}

function formatDateMedium(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateDMY(dateString) {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function unitLabelForMetric(key) {
  const id = normalizeUsageMetricKey(key)
  if (id === 'storage') return 'MB'
  if (id === 'documents') return 'documents'
  if (id === 'emails') return 'emails'
  if (id === 'sms') return 'sms'
  return 'queries'
}

/** Usage meter: title + grey subtitle, “Current Usage” row with fraction, teal bar, grey % label. */
function UsageMeterCard({ usageKey, used, included, unitLabel }) {
  const cfg = getUsageMetricTheme(usageKey)
  const label = cfg.label || String(usageKey).replace(/_/g, ' ')
  const subtitle =
    METRIC_SUBTITLE[String(usageKey).toLowerCase()] || METRIC_SUBTITLE[usageKey] || ''
  const u = Number(used) || 0
  const cap = Number(included) || 0
  const over = cap > 0 && u > cap
  const pct = cap > 0 ? Math.min(100, (u / cap) * 100) : u > 0 ? 100 : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-bold uppercase tracking-wide text-gray-900">{label.toUpperCase()}</span>
        {subtitle ? <span className="text-sm font-normal text-gray-500">{subtitle}</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-xs text-gray-500">Current Usage</span>
        <span className="ml-auto text-xs font-normal tabular-nums text-gray-500">
          {formatUsageMetricNumber(u, usageKey)} / {cap > 0 ? formatUsageMetricNumber(cap, usageKey) : '—'}{' '}
          <span className="font-normal text-gray-500">{unitLabel}</span>
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            over ? 'bg-orange-500' : 'bg-brand-teal'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn('mt-2 text-xs text-gray-500', over && 'text-orange-600')}>
        {pct.toFixed(1)}% used
      </p>
    </div>
  )
}

const TENANT_PLAN_RADIO_OPTIONS = [
  {
    value: 'PREMIUM',
    title: 'Premium',
    hint: 'Platform-managed APIs; we host Pinecone and OpenAI usage.',
    Icon: Sparkles,
    accent: 'from-violet-500 to-purple-800',
  },
  {
    value: 'BASIC',
    title: 'Basic',
    hint: 'Bring your own Pinecone and OpenAI keys (required for this plan).',
    Icon: KeyRound,
    accent: 'from-slate-600 to-slate-900',
  },
]

export default function TenantSubscriptionTab({ onProviderKeysUpdated }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [basicUsage, setBasicUsage] = useState(null)
  const subscriptionRef = useRef(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoicePageSize] = useState(10)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState('PREMIUM')
  const [updating, setUpdating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [providerKeys, setProviderKeys] = useState(null)
  const [loadingProviderKeys, setLoadingProviderKeys] = useState(false)
  const [savingProviderKeys, setSavingProviderKeys] = useState(false)
  const [isEditingProviderKeys, setIsEditingProviderKeys] = useState(false)
  const [providerKeyForm, setProviderKeyForm] = useState({
    PINECONE_API_KEY: '',
    PINECONE_INDEX_NAME: '',
    OPENAI_API_KEY: '',
  })
  const { showToast, ToastContainer } = useToast()
  const [addons, setAddons] = useState([])
  const [loadingAddons, setLoadingAddons] = useState(false)
  const [pollingAllocationId, setPollingAllocationId] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const [addonsExpanded, setAddonsExpanded] = useState(false)
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [invoiceSort, setInvoiceSort] = useState({ column: null, dir: null })

  const ADDONS_COLLAPSE_AT = 3

  const tenantId = user?.tenant_id

  useEffect(() => {
    subscriptionRef.current = subscription
  }, [subscription])

  useEffect(() => {
    if (tenantId) {
      fetchSubscription()
      fetchInvoices()
      fetchAddons()
    }
  }, [tenantId, invoicePage])

  const fetchSubscription = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/subscription`)
      setSubscription(response.data)
      await refreshUsageForPlan(response.data?.plan_type)
      if (response.data?.plan_type === 'BASIC') {
        fetchProviderKeys()
      } else {
        setProviderKeys(null)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
      if (error.response?.status === 404) {
        setSubscription(null)
        setUsage(null)
        setBasicUsage(null)
      } else {
        showToast('Failed to fetch subscription: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProviderKeys = async () => {
    setLoadingProviderKeys(true)
    try {
      const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/provider-keys`)
      setProviderKeys(response.data)
    } catch (error) {
      console.error('Failed to fetch provider keys:', error)
      showToast('Failed to fetch provider key status: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setLoadingProviderKeys(false)
    }
  }

  const handleSaveProviderKeys = async () => {
    if (!providerKeyForm.PINECONE_API_KEY || !providerKeyForm.PINECONE_INDEX_NAME || !providerKeyForm.OPENAI_API_KEY) {
      showToast('All provider keys are required', 'error')
      return
    }

    setSavingProviderKeys(true)
    try {
      await axios.put(`${API_URL}/api/tenants/${tenantId}/provider-keys`, providerKeyForm)
      showToast('Provider keys saved successfully', 'success')
      setProviderKeyForm({
        PINECONE_API_KEY: '',
        PINECONE_INDEX_NAME: '',
        OPENAI_API_KEY: '',
      })
      setIsEditingProviderKeys(false)
      fetchProviderKeys()
      if (onProviderKeysUpdated) {
        onProviderKeysUpdated()
      }
    } catch (error) {
      console.error('Failed to save provider keys:', error)
      showToast('Failed to save provider keys: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setSavingProviderKeys(false)
    }
  }

  const refreshUsageForPlan = async (planType) => {
    if (!tenantId || !planType) {
      setUsage(null)
      setBasicUsage(null)
      return
    }
    setLoadingUsage(true)
    try {
      if (planType === 'BASIC') {
        const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/usage/basic`)
        setBasicUsage(response.data)
        setUsage(null)
      } else {
        const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/usage`)
        setUsage(response.data)
        setBasicUsage(null)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      setUsage(null)
      setBasicUsage(null)
      if (error.response?.status !== 404) {
        showToast('Failed to fetch usage: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setLoadingUsage(false)
    }
  }

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/invoices`, {
        params: { page: invoicePage, page_size: invoicePageSize }
      })
      setInvoices(response.data.items || [])
      setInvoiceTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      showToast('Failed to fetch invoices: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchAddons = async () => {
    if (!tenantId) return
    setLoadingAddons(true)
    try {
      const response = await axios.get(`${API_URL}/api/subscriptions/tenant/query-addons`)
      setAddons(response.data || [])
    } catch (e) {
      // not fatal
    } finally {
      setLoadingAddons(false)
    }
  }

  const handlePayAddon = async (allocationId) => {
    try {
      const resp = await axios.post(`${API_URL}/api/subscriptions/query-addons/${allocationId}/checkout-session`)
      const url = resp.data?.checkout_url
      if (url) {
        window.open(url, '_blank')
        // Start short polling to detect payment success
        setPollingAllocationId(allocationId)
        setIsPolling(true)
        showToast('Checkout opened. We will update the status after payment.', 'success')
        startAddonPolling(allocationId)
      } else {
        showToast('Failed to get checkout URL for add-on', 'error')
      }
    } catch (e) {
      showToast('Unable to start checkout: ' + (e.response?.data?.detail || e.message), 'error')
    }
  }

  const startAddonPolling = (allocationId) => {
    let attempts = 0
    const maxAttempts = 60 // ~5 minutes at 5s interval
    const intervalMs = 5000
    const timer = setInterval(async () => {
      attempts += 1
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions/tenant/query-addons`)
        const list = response.data || []
        setAddons(list)
        const target = list.find(a => a.id === allocationId)
        if (target && target.payment_status === 'paid') {
          clearInterval(timer)
          setIsPolling(false)
          setPollingAllocationId(null)
          showToast('Add-on payment confirmed. Credits applied.', 'success')
          // refresh usage as credits may have been added
          refreshUsageForPlan(subscriptionRef.current?.plan_type)
        } else if (attempts >= maxAttempts) {
          clearInterval(timer)
          setIsPolling(false)
          setPollingAllocationId(null)
        }
      } catch {
        // ignore transient errors
      }
    }, intervalMs)
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
      TRIAL: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80',
      PAST_DUE: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
      CANCELED: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200/80',
      EXPIRED: 'bg-red-100 text-red-800 ring-1 ring-red-200/80',
    }
    return colors[status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80'
  }

  const getPlanName = (planType) => {
    const hasPrice = subscription?.plan_amount !== undefined && subscription?.plan_amount !== null
    const intervalText = subscription?.plan_interval || 'month'
    if (hasPrice && planType !== 'ONE_TIME') {
      if (planType === 'PREMIUM') return `Premium Plan (${formatCurrency(subscription.plan_amount)}/${intervalText})`
      if (planType === 'BASIC') return `Basic Plan (${formatCurrency(subscription.plan_amount)}/${intervalText})`
    }
    if (planType === 'PREMIUM') return 'Premium Plan'
    if (planType === 'BASIC') return 'Basic Plan'
    if (planType === 'ONE_TIME') return 'One-Time Setup'
    return planType
  }

  const getPlanDescription = (planType) => {
    const descriptions = {
      PREMIUM: 'Full access to all core features and integrations',
      BASIC: 'Self-service with client-provided APIs',
      ONE_TIME: 'Initial setup fee',
    }
    return descriptions[planType] || ''
  }

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/subscriptions/invoices/${invoiceId}/download-url`, {
        params: token ? { token } : undefined
      })
      const downloadUrl = response.data?.download_url
      if (!downloadUrl) {
        throw new Error('Download URL not returned by server')
      }
      window.open(downloadUrl, '_blank')
      showToast('Opening invoice PDF...', 'success')
    } catch (error) {
      console.error('Failed to download invoice:', error)
      showToast('Failed to download invoice: ' + (error.response?.data?.detail || error.message || 'Unknown error'), 'error')
    }
  }

  const handleUpdatePlan = async () => {
    if (!subscription) return

    if (subscription.plan_type === selectedPlanType) {
      showToast('Subscription is already on this plan', 'error')
      return
    }

    setUpdating(true)
    try {
      await axios.put(`${API_URL}/api/subscriptions/${subscription.id}`, {
        plan_type: selectedPlanType
      })
      showToast('Subscription plan updated successfully', 'success')
      setIsEditPlanModalOpen(false)
      fetchSubscription()
    } catch (error) {
      console.error('Failed to update subscription:', error)
      if (error.response?.status === 403) {
        showToast('You do not have permission to update subscription. Please contact Super User.', 'error')
      } else {
        showToast('Failed to update subscription: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleGetCheckoutUrl = async () => {
    if (!tenantId) {
      showToast('No tenant associated with your account', 'error')
      return
    }

    setCreating(true)
    try {
      const response = await axios.get(`${API_URL}/api/tenants/${tenantId}/subscription/checkout-url`)
      
      if (response.data.checkout_url) {
        showToast('Redirecting to payment...', 'success')
        // Open Stripe checkout in new window
        window.open(response.data.checkout_url, '_blank')
      } else {
        showToast('Failed to get checkout URL', 'error')
      }
    } catch (error) {
      console.error('Failed to get checkout URL:', error)
      if (error.response?.status === 403) {
        showToast('Access denied. Only Tenant Admin can access checkout URLs.', 'error')
      } else if (error.response?.status === 400) {
        showToast(error.response.data.detail || 'Payment already completed or subscription not found', 'error')
      } else {
        showToast('Failed to get checkout URL: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setCreating(false)
    }
  }

  const onInvoiceSort = useCallback((columnId) => {
    setInvoiceSort((prev) => cycleTableSort(columnId, prev))
  }, [])

  const filteredInvoices = useMemo(() => {
    const q = invoiceQuery.trim().toLowerCase()
    let rows = [...invoices]
    if (q) {
      rows = rows.filter(
        (inv) =>
          (inv.invoice_number || '').toLowerCase().includes(q) ||
          String(inv.status || '')
            .toLowerCase()
            .includes(q)
      )
    }
    const sortCol = invoiceSort.column
    const sortDir = invoiceSort.dir
    if (!sortCol || !sortDir) return rows
    const mult = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      if (sortCol === 'total_amount') {
        return mult * (Number(a.total_amount) - Number(b.total_amount))
      }
      if (sortCol === 'period_end') {
        const ta = new Date(a.period_end || a.created_at).getTime()
        const tb = new Date(b.period_end || b.created_at).getTime()
        return mult * (ta - tb)
      }
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      return mult * String(va).localeCompare(String(vb))
    })
    return rows
  }, [invoices, invoiceQuery, invoiceSort])

  if (!tenantId) {
    return (
      <div className="flex h-full min-h-[16rem] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <AlertCircle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-slate-700">No tenant associated with your account</p>
          <p className="mt-1 text-xs text-slate-500">Sign in with a tenant account to manage billing.</p>
        </div>
      </div>
    )
  }

  const isBasicPlan = subscription?.plan_type === 'BASIC'
  const hasAllProviderKeys = Boolean(
    providerKeys?.PINECONE_API_KEY &&
    providerKeys?.PINECONE_INDEX_NAME &&
    providerKeys?.OPENAI_API_KEY
  )
  const showProviderKeyStep = isBasicPlan && !hasAllProviderKeys
  const hasSetupPaymentInfo = Boolean(
    subscription?.setup_payment_status ||
    subscription?.setup_payment_amount ||
    subscription?.setup_payment_date
  )
  const showProviderKeyForm = showProviderKeyStep || isEditingProviderKeys

  return (
    <>
      <ToastContainer />
      <div className="mx-auto p-6">
        <div className="mb-4 rounded-xl bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Subscription &amp; Billing</h2>
          <p className="mt-1 text-sm text-gray-600">
            View your plan, track usage, and manage invoices in one place.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-brand-teal/40 bg-brand-teal/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-gray-900">Need to Change Your Plan?</p>
            <p className="mt-1 text-xs text-gray-600">
              Contact our support team to upgrade, downgrade, or customize your subscription.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="shrink-0 px-6"
            onClick={() => {
              window.location.href = 'mailto:support@meichat.com?subject=Subscription%20change'
            }}
          >
            Contact Support
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex gap-8 px-6 pt-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'usage', label: 'Usage' },
              { id: 'invoices', label: 'Invoices' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  '-mb-px shrink-0 border-b-2 pb-3 px-3 text-xs font-semibold transition-colors',
                  activeTab === t.id
                    ? 'border-brand-teal text-brand-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-16 shadow-sm">
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
                  <p className="mt-4 text-sm font-medium text-slate-600">Loading subscription…</p>
                </div>
              ) : !subscription ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <CreditCard className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No active subscription</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Contact your platform administrator to create a subscription for this organization.
                  </p>
                </div>
              ) : (
                <div className="mx-auto flex flex-col gap-5">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-medium tracking-wide text-gray-500">Current Plan</p>
                            <h3 className="mt-2 text-xl font-bold text-gray-900">{getPlanName(subscription.plan_type)}</h3>
                            <p className="mt-2 text-sm text-gray-600">{getPlanDescription(subscription.plan_type)}</p>
                          </div>
                          {/* {subscription.plan_type !== 'ONE_TIME' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlanType(subscription.plan_type)
                                setIsEditPlanModalOpen(true)
                              }}
                              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" strokeWidth={2} />
                              Change plan
                            </button>
                          )} */}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {subscription.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                              Active
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusColor(subscription.status)}`}
                            >
                              {subscription.status}
                            </span>
                          )}
                          {subscription.cancel_at_period_end && (
                            <span className="inline-flex items-center rounded-lg bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                              Cancels at period end
                            </span>
                          )}
                          {subscription.setup_payment_status === 'PAID' && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                              Setup Paid
                            </span>
                          )}
                          {subscription.setup_payment_status &&
                            subscription.setup_payment_status !== 'PAID' && (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                  subscription.setup_payment_status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                Setup: {subscription.setup_payment_status}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <Calendar className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-normal text-gray-900">Current Billing Cycle</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {subscription.current_period_start && subscription.current_period_end
                            ? `${formatDateMedium(subscription.current_period_start)} — ${formatDateMedium(subscription.current_period_end)}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <Calendar className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-normal text-gray-900">Started On</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {subscription.created_at ? formatDateMedium(subscription.created_at) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CreditCard className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-normal text-gray-900">Setup Fee</p>
                        <p className="mt-2 text-lg font-bold tabular-nums text-gray-900">
                          {subscription.setup_payment_amount != null
                            ? formatCurrency(subscription.setup_payment_amount)
                            : '—'}
                        </p>
                        {subscription.setup_payment_status === 'PAID' && subscription.setup_payment_date && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                              Paid
                            </span>
                            <span className="text-xs text-gray-500">
                              • Paid on {formatDateMedium(subscription.setup_payment_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      id="tenant-addons-overview"
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                        <Package className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-normal text-gray-900">Add-ons</p>
                        <p className="mt-2 text-sm text-gray-600">
                          {addons.length === 0
                            ? 'No add-ons active for this subscription'
                            : `${addons.length} add-on allocation${addons.length === 1 ? '' : 's'} active`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('tenant-addons-section')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-teal hover:text-brand-teal-hover"
                        >
                          Explore Add-ons <span aria-hidden>→</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {(subscription.setup_payment_status === 'PENDING' ||
                    subscription.status === 'TRIAL' ||
                    (subscription.status !== 'ACTIVE' && !subscription.setup_payment_status)) && (
                    <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-white p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                            <AlertCircle className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-amber-950">Payment required</h4>
                            <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
                              {subscription.setup_payment_status === 'PENDING' && subscription.setup_payment_amount
                                ? `A setup payment of ${formatCurrency(subscription.setup_payment_amount)} is required to activate your subscription.`
                                : 'Complete payment to activate your subscription.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGetCheckoutUrl}
                          disabled={creating}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Loading…
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" strokeWidth={2} />
                              Complete payment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isBasicPlan && (
                    <section
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        showProviderKeyStep ? 'border-red-200' : 'border-slate-200'
                      }`}
                    >
                      <div
                        className={`flex items-start gap-3 border-b px-5 py-4 sm:px-6 ${
                          showProviderKeyStep ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-slate-50/60'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                            showProviderKeyStep
                              ? 'border-red-200 bg-white text-red-600'
                              : 'border-slate-200 bg-white text-emerald-600'
                          }`}
                        >
                          {showProviderKeyStep ? (
                            <AlertCircle className="h-5 w-5" strokeWidth={2} />
                          ) : (
                            <KeyRound className="h-5 w-5" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <h4 className="text-sm font-bold text-slate-900 sm:text-base">Provider API keys</h4>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            On BASIC, Pinecone and OpenAI credentials are required before chatbots and actions work.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        {loadingProviderKeys ? (
                          <p className="text-sm text-slate-500">Loading status…</p>
                        ) : (
                          <div
                            role="group"
                            aria-label="Required provider credentials"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                          >
                            {[
                              { ok: providerKeys?.PINECONE_API_KEY, label: 'Pinecone API key', id: 'pk-pinecone-key' },
                              {
                                ok: providerKeys?.PINECONE_INDEX_NAME,
                                label: 'Pinecone index name',
                                id: 'pk-pinecone-idx',
                              },
                              { ok: providerKeys?.OPENAI_API_KEY, label: 'OpenAI API key', id: 'pk-openai' },
                            ].map((row) => (
                              <div
                                key={row.id}
                                role="checkbox"
                                aria-checked={Boolean(row.ok)}
                                className={`flex min-h-0 min-w-0 items-start gap-3 rounded-xl border px-3 py-3 sm:px-4 ${
                                  row.ok ? 'border-slate-200 bg-white' : 'border-red-200/80 bg-red-50/30'
                                }`}
                              >
                                <span
                                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 ${
                                    row.ok
                                      ? 'border-emerald-600 bg-emerald-600'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                  aria-hidden
                                >
                                  {row.ok ? (
                                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                  ) : null}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900">{row.label}</p>
                                  <p
                                    className={`mt-0.5 text-xs ${
                                      row.ok ? 'text-emerald-700' : 'text-red-700'
                                    }`}
                                  >
                                    {row.ok ? 'Configured' : 'Required — complete the form below'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!showProviderKeyStep && !showProviderKeyForm && (
                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={() => setIsEditingProviderKeys(true)}
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                            >
                              Edit API keys
                            </button>
                          </div>
                        )}

                        {showProviderKeyForm && (
                          <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                            <p className="text-sm text-slate-600">
                              {showProviderKeyStep
                                ? 'Enter all values below. Keys are stored securely and never shown in full after save.'
                                : 'Enter new values only for keys you want to rotate.'}
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
                              <div className="min-w-0">
                                <label
                                  htmlFor="tenant-pk-pinecone"
                                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  Pinecone API key
                                </label>
                                <input
                                  id="tenant-pk-pinecone"
                                  type="password"
                                  autoComplete="off"
                                  placeholder="sk-…"
                                  value={providerKeyForm.PINECONE_API_KEY}
                                  onChange={(e) =>
                                    setProviderKeyForm((prev) => ({ ...prev, PINECONE_API_KEY: e.target.value }))
                                  }
                                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                                />
                              </div>
                              <div className="min-w-0">
                                <label
                                  htmlFor="tenant-pk-index"
                                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  Pinecone index name
                                </label>
                                <input
                                  id="tenant-pk-index"
                                  type="text"
                                  autoComplete="off"
                                  placeholder="your-index-name"
                                  value={providerKeyForm.PINECONE_INDEX_NAME}
                                  onChange={(e) =>
                                    setProviderKeyForm((prev) => ({ ...prev, PINECONE_INDEX_NAME: e.target.value }))
                                  }
                                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                                />
                              </div>
                              <div className="min-w-0">
                                <label
                                  htmlFor="tenant-pk-openai"
                                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  OpenAI API key
                                </label>
                                <input
                                  id="tenant-pk-openai"
                                  type="password"
                                  autoComplete="off"
                                  placeholder="sk-…"
                                  value={providerKeyForm.OPENAI_API_KEY}
                                  onChange={(e) =>
                                    setProviderKeyForm((prev) => ({ ...prev, OPENAI_API_KEY: e.target.value }))
                                  }
                                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4">
                              <button
                                type="button"
                                onClick={handleSaveProviderKeys}
                                disabled={savingProviderKeys}
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingProviderKeys
                                  ? 'Saving…'
                                  : showProviderKeyStep
                                    ? 'Save keys'
                                    : 'Update keys'}
                              </button>
                              {!showProviderKeyStep && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditingProviderKeys(false)
                                    setProviderKeyForm({
                                      PINECONE_API_KEY: '',
                                      PINECONE_INDEX_NAME: '',
                                      OPENAI_API_KEY: '',
                                    })
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  <div
                    id="tenant-addons-section"
                    className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                          <Package className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Add-ons</h4>
                      </div>
                      {isPolling && (
                        <span className="text-xs font-medium text-slate-500">Checking payment status…</span>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      {loadingAddons ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                      ) : addons.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                          <Package className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} />
                          <p className="mt-2 text-sm font-medium text-slate-600">No add-ons yet</p>
                          <p className="mt-0.5 text-xs text-slate-500">Purchased query packs and extras will show here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(addonsExpanded || addons.length <= ADDONS_COLLAPSE_AT
                            ? addons
                            : addons.slice(0, ADDONS_COLLAPSE_AT)
                          ).map((a) => {
                            const units = a.allocated_units ?? a.allocated_queries ?? 0
                            const type = (a.usage_type || 'AI_QUERIES').toUpperCase()
                            const unitLabel =
                              type === 'STORAGE'
                                ? 'MB'
                                : type === 'DOCUMENTS'
                                  ? 'documents'
                                  : type === 'EMAILS'
                                    ? 'emails'
                                    : type === 'SMS'
                                      ? 'sms'
                                      : 'queries'
                            return (
                              <div
                                key={a.id}
                                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-4"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">
                                    {Number(units).toLocaleString()}{' '}
                                    <span className="font-medium text-slate-600">{unitLabel}</span>
                                  </div>
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {a.payment_status}
                                    <span className="text-slate-300"> · </span>
                                    {new Date(a.allocated_at).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                  <span className="text-sm font-bold tabular-nums text-slate-900">
                                    {a.currency} {Number(a.price_amount).toFixed(2)}
                                  </span>
                                  {a.payment_status !== 'paid' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePayAddon(a.id)}
                                      disabled={isPolling && pollingAllocationId === a.id}
                                      className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition ${
                                        isPolling && pollingAllocationId === a.id
                                          ? 'cursor-not-allowed bg-slate-400'
                                          : 'bg-violet-600 hover:bg-violet-700'
                                      }`}
                                    >
                                      {isPolling && pollingAllocationId === a.id ? 'Waiting…' : 'Pay'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {addons.length > ADDONS_COLLAPSE_AT && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setAddonsExpanded((e) => !e)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-500 transition ${addonsExpanded ? 'rotate-180' : ''}`}
                                  strokeWidth={2}
                                />
                                {addonsExpanded
                                  ? 'Show less'
                                  : `Show all add-ons (${addons.length})`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="mx-auto space-y-5">
              {loading || loadingUsage ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-brand-teal" />
                  <p className="mt-4 text-sm font-medium text-gray-600">Loading usage…</p>
                </div>
              ) : isBasicPlan && basicUsage ? (
                <div className="space-y-5">
                  {USAGE_METRIC_BASIC_ROWS.map(({ id, usedField }) => {
                    const used = Number(basicUsage[usedField]) || 0
                    const cap = Math.max(used, 1)
                    return (
                      <UsageMeterCard
                        key={id}
                        usageKey={id}
                        used={used}
                        included={cap}
                        unitLabel={unitLabelForMetric(id)}
                      />
                    )
                  })}
                </div>
              ) : !isBasicPlan && usage ? (
                <div className="space-y-5">
                  {usage.usage && Object.keys(usage.usage).length > 0 ? (
                    <div className="space-y-5">
                      {Object.entries(usage.usage).map(([key, item]) => (
                        <UsageMeterCard
                          key={key}
                          usageKey={key}
                          used={item.used}
                          included={item.included}
                          unitLabel={unitLabelForMetric(key)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
                      No metered usage rows for this period.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <TrendingUp className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No usage data available</p>
                  <p className="mt-1 text-xs text-gray-500">Usage will appear after your plan includes metered limits.</p>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="mx-auto space-y-4">
              {loadingInvoices ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-teal" />
                  <p className="mt-4 text-sm text-gray-500">Loading invoices…</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
                  <FileText className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.25} />
                  <p className="mt-4 text-sm font-medium text-gray-800">No invoices yet</p>
                  <p className="mt-1 text-sm text-gray-500">PDFs will be available here after each billing cycle.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
                      <p className="mt-1 text-sm text-gray-600">Download and review your billing history</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                      <SearchInput
                        value={invoiceQuery}
                        onChange={(e) => setInvoiceQuery(e.target.value)}
                        placeholder="Search here..."
                        className="w-full sm:w-64"
                        dashboardInput
                      />
                      <Button type="button" variant="outline" className="h-10 shrink-0 gap-2 px-3 text-sm">
                        <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                        Filters
                        <ChevronDown className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <Table
                      columns={[
                        {
                          id: 'invoice_number',
                          label: 'Invoice ID',
                          sortable: true,
                          accessor: 'invoice_number',
                          cellClassName: 'font-mono text-sm',
                        },
                        {
                          id: 'total_amount',
                          label: 'Amount',
                          sortable: true,
                          accessor: (row) => formatCurrency(row.total_amount),
                        },
                        {
                          id: 'status',
                          label: 'Status',
                          sortable: true,
                          render: (row) => {
                            const label =
                              row.status === 'PAID'
                                ? 'Paid'
                                : row.status === 'OPEN'
                                  ? 'Unpaid'
                                  : row.status
                            return (
                              <span
                                className={cn(
                                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                  row.status === 'PAID' && 'bg-emerald-50 text-emerald-800',
                                  row.status === 'OPEN' && 'bg-red-50 text-red-700',
                                  row.status !== 'PAID' &&
                                    row.status !== 'OPEN' &&
                                    'bg-gray-100 text-gray-700'
                                )}
                              >
                                {label}
                              </span>
                            )
                          },
                        },
                        {
                          id: 'period_end',
                          label: 'Date',
                          sortable: true,
                          accessor: (row) => formatDateDMY(row.period_end || row.created_at),
                        },
                        {
                          id: 'actions',
                          label: 'Actions',
                          sortable: false,
                          render: (row) =>
                            row.status === 'PAID' && row.stripe_invoice_id ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(row.id)}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:text-brand-teal-hover"
                              >
                                <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Download
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            ),
                        },
                      ]}
                      data={filteredInvoices}
                      keyExtractor={(row) => row.id}
                      onSortClick={onInvoiceSort}
                      sortColumnId={invoiceSort.column}
                      sortDirection={invoiceSort.dir}
                      className="pt-0 sm:pt-0 [&>div]:pt-0"
                      minWidth="720px"
                    />
                    {invoiceTotalPages > 1 ? (
                      <Pagination
                        currentPage={invoicePage}
                        totalPages={invoiceTotalPages}
                        onPageChange={setInvoicePage}
                        className="border-t border-gray-100 px-4 pb-4 sm:px-6"
                      />
                    ) : null}
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {isEditPlanModalOpen && subscription && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setIsEditPlanModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
            role="dialog"
            aria-labelledby="change-plan-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-violet-50/95 to-white px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-sm">
                  <Edit className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="change-plan-title" className="text-lg font-bold text-slate-900">
                    Change subscription plan
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">Applies to your next billing cycle.</p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
                onClick={() => setIsEditPlanModalOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Choose plan</p>
              <div
                role="radiogroup"
                aria-labelledby="change-plan-title"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {TENANT_PLAN_RADIO_OPTIONS.map((opt) => {
                  const sel = selectedPlanType === opt.value
                  const { Icon: PlanIcon } = opt
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setSelectedPlanType(opt.value)}
                      className={`relative flex flex-col gap-3 rounded-xl border p-4 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                        sel
                          ? 'border-violet-400 bg-violet-50/50 ring-2 ring-violet-500/25'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      {sel && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${opt.accent} text-white shadow-sm`}
                      >
                        <PlanIcon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 pr-7">
                        <span className="block text-sm font-bold text-slate-900">{opt.title}</span>
                        <span className="mt-1 block text-xs leading-snug text-slate-600">{opt.hint}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">
                Current subscription:{' '}
                <span className="font-medium text-slate-800">{getPlanName(subscription.plan_type)}</span>
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-slate-600">
                  Plan changes take effect immediately; your next invoice reflects the new rate.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setIsEditPlanModalOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={updating || selectedPlanType === subscription.plan_type}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {updating ? 'Updating…' : 'Update plan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
