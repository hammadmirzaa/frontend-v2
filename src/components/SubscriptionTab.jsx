import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Search,
  Plus,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Building2,
  Layers,
  Activity,
  CalendarRange,
  Wallet,
  SlidersHorizontal,
  Receipt,
  PackagePlus,
  Check,
  CircleDollarSign,
  Hash,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import BasicUsageSummary from './BasicUsageSummary'
import { getUsageMetricTheme, getUsageAllocationVisual } from '../theme/usageMetrics'

const API_URL = config.API_URL

/** Super-admin subscription console embedded on a tenant detail page (full detail: usage, limits, invoices, add-ons, custom bills). */
function TenantEmbeddedSubscription({ tenantId, tenantName, onChanged, showToast }) {
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newPlanType, setNewPlanType] = useState('PREMIUM')
  const [setupPaymentRequired, setSetupPaymentRequired] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const plansRes = await axios.get(`${API_URL}/api/subscriptions/plans`)
      let subData = null
      try {
        const subRes = await axios.get(`${API_URL}/api/tenants/${tenantId}/subscription`)
        subData = subRes.data
      } catch (e) {
        if (e.response?.status !== 404) throw e
      }
      setPlans(plansRes.data || [])
      setSubscription(subData)
    } catch (e) {
      console.error(e)
      showToast(e.response?.data?.detail || e.message || 'Failed to load subscription', 'error')
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const refreshSubscriptionById = async (subscriptionId) => {
    const r = await axios.get(`${API_URL}/api/subscriptions/${subscriptionId}`)
    setSubscription(r.data)
    onChanged?.()
  }

  const handleUpdatePlan = async (subscriptionId, planType) => {
    await axios.put(`${API_URL}/api/subscriptions/${subscriptionId}`, { plan_type: planType })
    showToast('Subscription plan updated successfully', 'success')
    await refreshSubscriptionById(subscriptionId)
  }

  const handleCancelSubscription = async (subscriptionId, cancelAtPeriodEnd = true) => {
    await axios.post(`${API_URL}/api/subscriptions/${subscriptionId}/cancel`, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    showToast(cancelAtPeriodEnd ? 'Subscription will be canceled at period end' : 'Subscription canceled', 'success')
    await refreshSubscriptionById(subscriptionId)
  }

  const handleReactivateSubscription = async (subscriptionId) => {
    await axios.post(`${API_URL}/api/subscriptions/${subscriptionId}/reactivate`)
    showToast('Subscription reactivated successfully', 'success')
    await refreshSubscriptionById(subscriptionId)
  }

  const handleCreateSubscription = async () => {
    setCreating(true)
    try {
      await axios.post(`${API_URL}/api/subscriptions/`, {
        tenant_id: tenantId,
        plan_type: newPlanType,
        setup_payment_required: setupPaymentRequired,
      })
      showToast('Subscription created. Tenant admin can complete payment from their subscription page.', 'success')
      setCreateOpen(false)
      await load()
      onChanged?.()
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const formatCurrency = (amount) => {
    if (amount == null) return '$0.00'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getPlanLabel = (planType) => {
    const plan = plans.find((p) => p.plan_type === planType)
    if (plan && plan.amount !== undefined && plan.amount !== null) {
      const amountText = `${formatCurrency(plan.amount)}/${plan.interval || 'month'}`
      if (planType === 'PREMIUM') return `Premium (${amountText})`
      if (planType === 'BASIC') return `Basic (${amountText})`
    }
    if (planType === 'PREMIUM') return 'Premium'
    if (planType === 'BASIC') return 'Basic'
    return planType
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-24 rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 opacity-[0.08]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                <CreditCard className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">No subscription yet</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  This tenant has no active plan. Create a subscription to enable billing, usage, and invoices.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Create subscription
            </button>
          </div>
        </div>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">Create subscription</h3>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setCreateOpen(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Plan</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value)}
                  >
                    <option value="PREMIUM">{getPlanLabel('PREMIUM')}</option>
                    <option value="BASIC">{getPlanLabel('BASIC')}</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={setupPaymentRequired}
                    onChange={(e) => setSetupPaymentRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Setup payment required
                </label>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={handleCreateSubscription}
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <SubscriptionDetailModal
      variant="embedded"
      subscription={subscription}
      tenant={{ id: tenantId, name: tenantName }}
      plans={plans}
      onClose={() => {}}
      onUpdatePlan={handleUpdatePlan}
      onCancel={handleCancelSubscription}
      onReactivate={handleReactivateSubscription}
      onRefresh={refreshSubscriptionById}
      showToast={showToast}
    />
  )
}

function SubscriptionAdminList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeView, setActiveView] = useState('subscriptions') // 'subscriptions' or 'plans'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedPlanType, setSelectedPlanType] = useState('PREMIUM')
  const [setupPaymentRequired, setSetupPaymentRequired] = useState(false)
  const [creating, setCreating] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [updatingPlan, setUpdatingPlan] = useState(false)
  
  // Plan form fields
  const [newPlanType, setNewPlanType] = useState('PREMIUM')
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [newPlanAmount, setNewPlanAmount] = useState('')
  const [newPlanCurrency, setNewPlanCurrency] = useState('USD')
  const [newPlanTypeValue, setNewPlanTypeValue] = useState('recurring')
  const [newPlanInterval, setNewPlanInterval] = useState('month')
  const [newPlanIsActive, setNewPlanIsActive] = useState(true)
  
  // Edit plan fields
  const [editPlanName, setEditPlanName] = useState('')
  const [editPlanDescription, setEditPlanDescription] = useState('')
  const [editPlanAmount, setEditPlanAmount] = useState('')
  const [editPlanIsActive, setEditPlanIsActive] = useState(true)
  
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    if (activeView === 'subscriptions') {
      fetchSubscriptions()
      fetchTenants()
      fetchPlans()
    } else if (activeView === 'plans') {
      fetchPlans()
    }
  }, [page, statusFilter, planFilter, activeView])

  const fetchPlans = async () => {
    setLoadingPlans(true)
    try {
      const response = await axios.get(`${API_URL}/api/subscriptions/plans`)
      setPlans(response.data || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      if (error.response?.status === 403) {
        showToast('Access denied. Super User privileges required.', 'error')
      } else {
        showToast('Failed to fetch plans: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tenants/`, { params: { page: 1, page_size: 1000 } })
      setTenants(response.data.items || [])
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
      if (error.response?.status === 403) {
        showToast('Access denied. Super User privileges required to view tenants.', 'error')
      } else {
        showToast('Failed to fetch tenants: ' + (error.response?.data?.detail || error.message), 'error')
      }
    }
  }

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (planFilter !== 'all') {
        params.plan_type = planFilter
      }
      const response = await axios.get(`${API_URL}/api/subscriptions/`, { params })
      setSubscriptions(response.data.items || [])
      setTotalPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      if (error.response?.status === 403) {
        showToast('Access denied. Super User privileges required.', 'error')
      } else {
        showToast('Failed to fetch subscriptions: ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
    // Refresh tenants when opening modal
    if (tenants.length === 0) {
      fetchTenants()
    }
  }

  const handleCreateSubscription = async () => {
    if (!selectedTenantId) {
      showToast('Please select a tenant', 'error')
      return
    }

    setCreating(true)
    try {
      const response = await axios.post(`${API_URL}/api/subscriptions/`, {
        tenant_id: selectedTenantId,
        plan_type: selectedPlanType,
        setup_payment_required: setupPaymentRequired
      })
      
      // Super Admin does not receive checkout_url - payment must be completed by Tenant Admin
      showToast('Subscription created successfully. Tenant Admin must complete payment via their subscription page.', 'success')
      
      setIsCreateModalOpen(false)
      setSelectedTenantId('')
      setSelectedPlanType('PREMIUM')
      setSetupPaymentRequired(false)
      fetchSubscriptions()
    } catch (error) {
      console.error('Failed to create subscription:', error)
      showToast('Failed to create subscription: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdatePlan = async (subscriptionId, newPlanType) => {
    try {
      await axios.put(`${API_URL}/api/subscriptions/${subscriptionId}`, {
        plan_type: newPlanType
      })
      showToast('Subscription plan updated successfully', 'success')
      fetchSubscriptions()
      if (selectedSubscription?.id === subscriptionId) {
        fetchSubscriptionDetails(subscriptionId)
      }
    } catch (error) {
      console.error('Failed to update subscription:', error)
      showToast('Failed to update subscription: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleCancelSubscription = async (subscriptionId, cancelAtPeriodEnd = true) => {
    try {
      await axios.post(`${API_URL}/api/subscriptions/${subscriptionId}/cancel`, {
        cancel_at_period_end: cancelAtPeriodEnd
      })
      showToast(cancelAtPeriodEnd ? 'Subscription will be canceled at period end' : 'Subscription canceled immediately', 'success')
      fetchSubscriptions()
      if (selectedSubscription?.id === subscriptionId) {
        fetchSubscriptionDetails(subscriptionId)
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      showToast('Failed to cancel subscription: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleReactivateSubscription = async (subscriptionId) => {
    try {
      await axios.post(`${API_URL}/api/subscriptions/${subscriptionId}/reactivate`)
      showToast('Subscription reactivated successfully', 'success')
      fetchSubscriptions()
      if (selectedSubscription?.id === subscriptionId) {
        fetchSubscriptionDetails(subscriptionId)
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      showToast('Failed to reactivate subscription: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleCreatePlan = async () => {
    if (!newPlanName || !newPlanAmount) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    const amount = parseFloat(newPlanAmount)
    if (isNaN(amount) || amount < 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    setCreatingPlan(true)
    try {
      const planData = {
        plan_type: newPlanType,
        name: newPlanName,
        description: newPlanDescription || null,
        amount: amount,
        currency: newPlanCurrency,
        type: newPlanTypeValue,
        interval: newPlanTypeValue === 'recurring' ? newPlanInterval : null,
        is_active: newPlanIsActive
      }

      await axios.post(`${API_URL}/api/subscriptions/plans`, planData)
      showToast('Subscription plan created successfully', 'success')
      setIsCreatePlanModalOpen(false)
      setNewPlanType('PREMIUM')
      setNewPlanName('')
      setNewPlanDescription('')
      setNewPlanAmount('')
      setNewPlanCurrency('USD')
      setNewPlanTypeValue('recurring')
      setNewPlanInterval('month')
      setNewPlanIsActive(true)
      fetchPlans()
    } catch (error) {
      console.error('Failed to create plan:', error)
      showToast('Failed to create plan: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setCreatingPlan(false)
    }
  }

  const handleUpdatePlanPricing = async () => {
    if (!selectedPlan || !editPlanName || !editPlanAmount) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    const amount = parseFloat(editPlanAmount)
    if (isNaN(amount) || amount < 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    setUpdatingPlan(true)
    try {
      const planData = {
        name: editPlanName,
        description: editPlanDescription || null,
        amount: amount,
        is_active: editPlanIsActive
      }

      await axios.put(`${API_URL}/api/subscriptions/plans/${selectedPlan.plan_type}`, planData)
      showToast('Subscription plan updated successfully', 'success')
      setIsEditPlanModalOpen(false)
      setSelectedPlan(null)
      fetchPlans()
    } catch (error) {
      console.error('Failed to update plan:', error)
      showToast('Failed to update plan: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setUpdatingPlan(false)
    }
  }

  const fetchSubscriptionDetails = async (subscriptionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/subscriptions/${subscriptionId}`)
      setSelectedSubscription(response.data)
    } catch (error) {
      console.error('Failed to fetch subscription details:', error)
      showToast('Failed to fetch subscription details', 'error')
    }
  }

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription)
    setIsDetailModalOpen(true)
    fetchSubscriptionDetails(subscription.id)
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700',
      TRIAL: 'bg-blue-100 text-blue-700',
      PAST_DUE: 'bg-yellow-100 text-yellow-700',
      CANCELED: 'bg-orange-100 text-orange-700',
      EXPIRED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPlanName = (planType) => {
    const plan = plans.find((p) => p.plan_type === planType)
    if (plan && plan.amount !== undefined && plan.amount !== null) {
      const amountText = `${formatCurrency(plan.amount)}/${plan.interval || 'month'}`
      if (planType === 'PREMIUM') return `Premium (${amountText})`
      if (planType === 'BASIC') return `Basic (${amountText})`
      if (planType === 'ONE_TIME') return `One-Time Setup (${formatCurrency(plan.amount)})`
    }
    if (planType === 'PREMIUM') return 'Premium'
    if (planType === 'BASIC') return 'Basic'
    if (planType === 'ONE_TIME') return 'One-Time Setup'
    return planType
  }

  const getSetupFeeText = () => {
    const setupPlan = plans.find((p) => p.plan_type === 'ONE_TIME')
    if (setupPlan?.amount !== undefined && setupPlan?.amount !== null) {
      return formatCurrency(setupPlan.amount)
    }
    return '$0.00'
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

  return (
    <>
      <ToastContainer />
      <div className="mx-auto w-full max-w-7xl pb-8">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
                <CreditCard className="shrink-0 text-indigo-600" size={26} strokeWidth={1.75} />
                Subscription Management
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Manage tenant subscriptions, billing, and subscription plans
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {activeView === 'subscriptions' && (
                <>
                  <div className="text-sm text-slate-600">
                    Total: <span className="font-semibold text-slate-900">{total}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                  >
                    <Plus size={20} />
                    Create Subscription
                  </button>
                </>
              )}
              {activeView === 'plans' && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPlanType('PREMIUM')
                    setNewPlanName('')
                    setNewPlanDescription('')
                    setNewPlanAmount('')
                    setNewPlanCurrency('USD')
                    setNewPlanTypeValue('recurring')
                    setNewPlanInterval('month')
                    setNewPlanIsActive(true)
                    setIsCreatePlanModalOpen(true)
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  <Plus size={20} />
                  Create Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-2 py-2 sm:px-4">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex min-w-min gap-1">
              <button
                type="button"
                onClick={() => setActiveView('subscriptions')}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeView === 'subscriptions'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                Subscriptions
              </button>
              <button
                type="button"
                onClick={() => setActiveView('plans')}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeView === 'plans'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                Plans Management
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Only show for subscriptions view */}
        {activeView === 'subscriptions' && (
          <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by tenant..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto lg:min-w-[140px]"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELED">Canceled</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto lg:min-w-[140px]"
              >
                <option value="all">All Plans</option>
                <option value="PREMIUM">Premium</option>
                <option value="BASIC">Basic</option>
                <option value="ONE_TIME">One-Time</option>
              </select>
            </div>
          </div>
        )}

        {/* Plans Management View */}
        {activeView === 'plans' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loadingPlans ? (
              <div className="py-12 text-center text-sm text-slate-500">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                Loading plans…
              </div>
            ) : plans.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No subscription plans found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900">{plan.name}</h4>
                        <p className="mt-1 text-xs text-slate-500">{plan.plan_type}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                          plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {plan.description && <p className="mb-3 text-sm text-slate-600">{plan.description}</p>}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Price:</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(plan.amount)} {plan.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-medium capitalize text-slate-700">{plan.type}</span>
                      </div>
                      {plan.interval && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Interval:</span>
                          <span className="font-medium capitalize text-slate-700">{plan.interval}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan)
                        setEditPlanName(plan.name)
                        setEditPlanDescription(plan.description || '')
                        setEditPlanAmount(plan.amount.toString())
                        setEditPlanIsActive(plan.is_active)
                        setIsEditPlanModalOpen(true)
                      }}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
                    >
                      <Edit size={16} />
                      Edit Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Table */}
        {activeView === 'subscriptions' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              Loading subscriptions…
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No subscriptions found</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {subscriptions.map((subscription) => {
                  const tenant = tenants.find((t) => t.id === subscription.tenant_id)
                  return (
                    <li
                      key={subscription.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4 shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">{tenant?.name || 'Unknown Tenant'}</p>
                      <p className="text-xs text-slate-500">ID: {subscription.tenant_id.substring(0, 8)}…</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                          {getPlanName(subscription.plan_type)}
                        </span>
                        <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </div>
                      {subscription.cancel_at_period_end && (
                        <p className="mt-2 text-xs text-orange-600">Cancels at period end</p>
                      )}
                      <p className="mt-2 text-xs text-slate-600">
                        {subscription.current_period_start && subscription.current_period_end
                          ? `${formatDate(subscription.current_period_start)} → ${formatDate(subscription.current_period_end)}`
                          : 'Period: N/A'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(subscription)}
                        className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View details
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="hidden max-h-[calc(100vh-26rem)] overflow-auto rounded-2xl border border-slate-200 md:block">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/90">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Setup Payment
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map((subscription) => {
                      const tenant = tenants.find((t) => t.id === subscription.tenant_id)
                      return (
                        <tr key={subscription.id} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900">{tenant?.name || 'Unknown Tenant'}</p>
                            <p className="text-xs text-slate-500">ID: {subscription.tenant_id.substring(0, 8)}…</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                              {getPlanName(subscription.plan_type)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                              {subscription.status}
                            </span>
                            {subscription.cancel_at_period_end && (
                              <p className="mt-1 text-xs text-orange-600">Cancels at period end</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {subscription.current_period_start && subscription.current_period_end ? (
                              <div>
                                <p>{formatDate(subscription.current_period_start)}</p>
                                <p className="text-xs text-slate-400">to {formatDate(subscription.current_period_end)}</p>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {subscription.setup_payment_status ? (
                              <span
                                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                                  subscription.setup_payment_status === 'PAID'
                                    ? 'bg-green-100 text-green-700'
                                    : subscription.setup_payment_status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {subscription.setup_payment_status}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">N/A</span>
                            )}
                            {subscription.setup_payment_amount && (
                              <p className="mt-1 text-xs text-slate-500">
                                {formatCurrency(subscription.setup_payment_amount)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(subscription)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-slate-50"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {activeView === 'subscriptions' && totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-sm text-slate-600 sm:text-left">
                Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages}</span> ({total} total)
              </p>
              <div className="flex justify-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`rounded-xl border border-slate-200 p-2 transition-colors ${
                    page === 1 ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="flex items-center px-3 text-sm font-semibold text-slate-800">{page}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`rounded-xl border border-slate-200 p-2 transition-colors ${
                    page === totalPages ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
        </div>
      </div>

      {/* Create Subscription Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">Create Subscription</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setSelectedTenantId('')
                  setSelectedPlanType('PREMIUM')
                  setSetupPaymentRequired(false)
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tenant</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={tenants.length === 0}
                >
                  <option value="">
                    {tenants.length === 0 ? 'Loading tenants...' : 'Select a tenant'}
                  </option>
                  {tenants
                    .filter((t) => t.is_active !== false)
                    .map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                </select>
                {tenants.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">No tenants available. Please create a tenant first.</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Plan Type</label>
                <select
                  value={selectedPlanType}
                  onChange={(e) => setSelectedPlanType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="PREMIUM">{getPlanName('PREMIUM')}</option>
                  <option value="BASIC">{getPlanName('BASIC')}</option>
                  <option value="ONE_TIME">{getPlanName('ONE_TIME')}</option>
                </select>
              </div>
              {selectedPlanType !== 'ONE_TIME' && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    id="setupPayment"
                    checked={setupPaymentRequired}
                    onChange={(e) => setSetupPaymentRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span>Require setup payment ({getSetupFeeText()})</span>
                </label>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setSelectedTenantId('')
                  setSelectedPlanType('PREMIUM')
                  setSetupPaymentRequired(false)
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubscription}
                disabled={creating || !selectedTenantId}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Detail Modal */}
      {isDetailModalOpen && selectedSubscription && (
        <SubscriptionDetailModal
          subscription={selectedSubscription}
          tenant={tenants.find(t => t.id === selectedSubscription.tenant_id)}
          plans={plans}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedSubscription(null)
          }}
          onUpdatePlan={handleUpdatePlan}
          onCancel={handleCancelSubscription}
          onReactivate={handleReactivateSubscription}
          onRefresh={fetchSubscriptionDetails}
          showToast={showToast}
        />
      )}

      {/* Create Plan Modal */}
      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Subscription Plan</h3>
              <button
                onClick={() => setIsCreatePlanModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPlanType}
                  onChange={(e) => setNewPlanType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="PREMIUM">Premium</option>
                  <option value="BASIC">Basic</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., Premium Plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Plan description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPlanAmount}
                  onChange={(e) => setNewPlanAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={newPlanCurrency}
                  onChange={(e) => setNewPlanCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPlanTypeValue}
                  onChange={(e) => {
                    setNewPlanTypeValue(e.target.value)
                    if (e.target.value === 'one_time') {
                      setNewPlanInterval(null)
                    } else {
                      setNewPlanInterval('month')
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="recurring">Recurring</option>
                  <option value="one_time">One-Time</option>
                </select>
              </div>
              {newPlanTypeValue === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={newPlanInterval}
                    onChange={(e) => setNewPlanInterval(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="month">Monthly</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newPlanIsActive"
                  checked={newPlanIsActive}
                  onChange={(e) => setNewPlanIsActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="newPlanIsActive" className="text-sm text-gray-700">
                  Plan is active
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={() => setIsCreatePlanModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={creatingPlan || !newPlanName || !newPlanAmount}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPlan ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {isEditPlanModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Subscription Plan</h3>
              <button
                onClick={() => {
                  setIsEditPlanModalOpen(false)
                  setSelectedPlan(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Type
                </label>
                <input
                  type="text"
                  value={selectedPlan.plan_type}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Plan type cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editPlanDescription}
                  onChange={(e) => setEditPlanDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPlanAmount}
                  onChange={(e) => setEditPlanAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editPlanIsActive"
                  checked={editPlanIsActive}
                  onChange={(e) => setEditPlanIsActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="editPlanIsActive" className="text-sm text-gray-700">
                  Plan is active
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setIsEditPlanModalOpen(false)
                  setSelectedPlan(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlanPricing}
                disabled={updatingPlan || !editPlanName || !editPlanAmount}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingPlan ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const ALLOC_USAGE_TYPE_OPTIONS = [
  { value: 'AI_QUERIES', title: 'AI queries', hint: 'Chat & completions' },
  { value: 'DOCUMENTS', title: 'Documents', hint: 'Page-weighted' },
  { value: 'EMAILS', title: 'Emails', hint: 'Outbound email' },
  { value: 'SMS', title: 'SMS', hint: 'Text messages' },
  { value: 'STORAGE', title: 'Storage', hint: 'Megabytes' },
]

function EditUsageLimitModal({ selectedUsageType, selectedLimit, setSelectedLimit, onClose, onSave, limitSaving }) {
  const { Icon: LimitTypeIcon, accent: limitAccent, label: limitLabel } = getUsageAllocationVisual(selectedUsageType)

  const fieldCardClass =
    'relative flex min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/15 to-indigo-600/10 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-violet-50/20" />
        <div className="relative p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${limitAccent} text-white shadow-lg`}
              >
                <LimitTypeIcon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">{limitLabel}</h3>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {selectedUsageType}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  Set included volume per period, then how overage is priced per billing increment.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="self-end rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-700 sm:self-start"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {/* Included — sky */}
            <div className={fieldCardClass}>
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 opacity-[0.08]"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                  <Layers className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Included</p>
                  <p className="text-sm font-semibold text-slate-900">Plan allowance</p>
                </div>
              </div>
              <input
                type="number"
                min={0}
                className="relative mt-4 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-2xl font-bold tabular-nums tracking-tight text-slate-900 shadow-inner focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                value={selectedLimit.included_limit}
                onChange={(e) =>
                  setSelectedLimit({ ...selectedLimit, included_limit: parseInt(e.target.value, 10) || 0 })
                }
              />
              <p className="relative mt-auto pt-4 text-xs leading-relaxed text-slate-500">
                Free pool each billing cycle before any overage line items.
              </p>
            </div>

            {/* Overage rate — amber */}
            <div className={fieldCardClass}>
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 opacity-[0.08]"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-sm">
                  <CircleDollarSign className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overage</p>
                  <p className="text-sm font-semibold text-slate-900">Price per unit</p>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                min={0}
                className="relative mt-4 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-2xl font-bold tabular-nums tracking-tight text-slate-900 shadow-inner focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                value={selectedLimit.overage_rate}
                onChange={(e) =>
                  setSelectedLimit({ ...selectedLimit, overage_rate: parseFloat(e.target.value) || 0 })
                }
              />
              <p className="relative mt-auto pt-4 text-xs leading-relaxed text-slate-500">
                USD charged for each overage bundle (see “Increment” next).
              </p>
            </div>

            {/* Overage unit — slate */}
            <div className={fieldCardClass}>
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-slate-500 to-slate-800 opacity-[0.08]"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-800 text-white shadow-sm">
                  <Hash className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Increment</p>
                  <p className="text-sm font-semibold text-slate-900">Units per charge</p>
                </div>
              </div>
              <input
                type="number"
                min={1}
                className="relative mt-4 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-2xl font-bold tabular-nums tracking-tight text-slate-900 shadow-inner focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/25"
                value={selectedLimit.overage_unit}
                onChange={(e) =>
                  setSelectedLimit({ ...selectedLimit, overage_unit: parseInt(e.target.value, 10) || 1 })
                }
              />
              <p className="relative mt-auto pt-4 text-xs leading-relaxed text-slate-500">
                Overage is billed in bundles of this size (e.g. 1000 = each thousand units beyond included).
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              onClick={onSave}
              disabled={limitSaving}
            >
              {limitSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Subscription Detail Modal Component (also used embedded on tenant page via variant="embedded")
function SubscriptionDetailModal({
  variant = 'modal',
  subscription,
  tenant,
  plans = [],
  onClose,
  onUpdatePlan,
  onCancel,
  onReactivate,
  onRefresh,
  showToast,
}) {
  const [usage, setUsage] = useState(null)
  const [basicUsage, setBasicUsage] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [usageLimits, setUsageLimits] = useState([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [loadingLimits, setLoadingLimits] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [isEditLimitModalOpen, setIsEditLimitModalOpen] = useState(false)
  const [selectedUsageType, setSelectedUsageType] = useState(null)
  const [selectedLimit, setSelectedLimit] = useState(null)
  const [limitSaving, setLimitSaving] = useState(false)
  const [isManualBillOpen, setIsManualBillOpen] = useState(false)
  const [billAmount, setBillAmount] = useState('')
  const [billDescription, setBillDescription] = useState('')
  const [billDueDays, setBillDueDays] = useState('30')
  const [billMarkPaid, setBillMarkPaid] = useState(false)
  const [billSubmitting, setBillSubmitting] = useState(false)

  useEffect(() => {
    if (subscription.tenant_id) {
      fetchUsage()
      fetchInvoices()
      fetchUsageLimits()
    }
  }, [subscription.tenant_id, subscription.plan_type])

  const fetchUsage = async () => {
    setLoadingUsage(true)
    try {
      if (subscription.plan_type === 'BASIC') {
        const response = await axios.get(`${API_URL}/api/tenants/${subscription.tenant_id}/usage/basic`)
        setBasicUsage(response.data)
        setUsage(null)
      } else {
        const response = await axios.get(`${API_URL}/api/tenants/${subscription.tenant_id}/usage`)
        setUsage(response.data)
        setBasicUsage(null)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      setUsage(null)
      setBasicUsage(null)
    } finally {
      setLoadingUsage(false)
    }
  }

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await axios.get(`${API_URL}/api/tenants/${subscription.tenant_id}/invoices`, {
        params: { page: 1, page_size: 50 }
      })
      setInvoices(response.data.items || [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchUsageLimits = async () => {
    setLoadingLimits(true)
    try {
      const response = await axios.get(`${API_URL}/api/subscriptions/usage-limits`, {
        params: { tenant_id: subscription.tenant_id },
      })
      setUsageLimits(response.data || [])
    } catch (error) {
      console.error('Failed to fetch usage limits:', error)
      setUsageLimits([])
    } finally {
      setLoadingLimits(false)
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700',
      TRIAL: 'bg-blue-100 text-blue-700',
      PAST_DUE: 'bg-yellow-100 text-yellow-700',
      CANCELED: 'bg-orange-100 text-orange-700',
      EXPIRED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPlanName = (planType) => {
    const plan = plans.find((p) => p.plan_type === planType)
    if (plan && plan.amount !== undefined && plan.amount !== null) {
      if (planType === 'ONE_TIME') {
        return `One-Time Setup (${formatCurrency(plan.amount)})`
      }
      return `${plan.name || planType} (${formatCurrency(plan.amount)}/${plan.interval || 'month'})`
    }

    if (planType === 'PREMIUM') return 'Premium'
    if (planType === 'BASIC') return 'Basic'
    if (planType === 'ONE_TIME') return 'One-Time Setup'
    return planType
  }

  const getUsageTypeVisual = (rawKey) => {
    const t = getUsageMetricTheme(rawKey)
    return { Icon: t.Icon, accent: t.gradientAccent }
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

  const handleUpdateUsageLimit = async () => {
    if (!selectedLimit || !selectedUsageType) return
    setLimitSaving(true)
    try {
      await axios.put(
        `${API_URL}/api/subscriptions/usage-limits/${selectedUsageType}`,
        {
          included_limit: selectedLimit.included_limit,
          overage_rate: selectedLimit.overage_rate,
          overage_unit: parseInt(selectedLimit.overage_unit, 10) || 1,
        },
        { params: { tenant_id: subscription.tenant_id } },
      )
      showToast('Usage limit updated', 'success')
      setIsEditLimitModalOpen(false)
      setSelectedLimit(null)
      setSelectedUsageType(null)
      fetchUsageLimits()
      onRefresh(subscription.id)
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setLimitSaving(false)
    }
  }

  const submitManualBill = async () => {
    const amt = Number.parseFloat(String(billAmount).trim())
    if (!subscription.tenant_id || Number.isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount greater than zero', 'error')
      return
    }
    setBillSubmitting(true)
    try {
      await axios.post(`${API_URL}/api/tenants/${subscription.tenant_id}/invoices/manual`, {
        amount: amt,
        currency: 'USD',
        description: billDescription.trim() || null,
        due_in_days: parseInt(billDueDays, 10) || 30,
        mark_paid: billMarkPaid,
      })
      showToast('Bill recorded for tenant', 'success')
      setIsManualBillOpen(false)
      setBillAmount('')
      setBillDescription('')
      setBillDueDays('30')
      setBillMarkPaid(false)
      fetchInvoices()
      onRefresh(subscription.id)
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    } finally {
      setBillSubmitting(false)
    }
  }

  const isModal = variant === 'modal'
  const shellClass = isModal
    ? 'w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl sm:p-6'
    : 'w-full overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6'

  const panel = (
      <div className={shellClass}>
        {isModal ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-900">Subscription Details</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900">Subscription</h3>
            <p className="mt-1 text-sm text-slate-600">
              Plan, usage, limits, invoices (including custom bills), and add-on allocation for{' '}
              <span className="font-medium text-slate-900">{tenant?.name || 'this tenant'}</span>.
            </p>
          </div>
        )}

        {/* Tabs — horizontal scroll on narrow viewports */}
        <div className="-mx-1 mb-4 border-b border-slate-100">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] px-1 pb-2">
            <div className="flex min-w-min gap-1">
              {[
                { id: 'details', label: 'Details' },
                { id: 'usage', label: 'Usage' },
                { id: 'limits', label: 'Limits' },
                { id: 'invoices', label: 'Invoices' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                    activeTab === id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Overview</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 opacity-[0.1]" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                      <Building2 className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</p>
                      <p className="mt-1 text-base font-bold text-slate-900">{tenant?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-800 opacity-[0.1]" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-800 text-white shadow-sm">
                      <Layers className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan type</p>
                      <p className="mt-1 text-sm font-bold leading-snug text-slate-900">{getPlanName(subscription.plan_type)}</p>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-800 opacity-[0.1]" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 text-white shadow-sm">
                      <Activity className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                      <span
                        className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusColor(subscription.status)}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 opacity-[0.1]" />
                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-sm">
                      <CalendarRange className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current billing period</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {subscription.current_period_start && subscription.current_period_end
                          ? `${formatDate(subscription.current_period_start)} — ${formatDate(subscription.current_period_end)}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {subscription.setup_payment_status && (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 opacity-[0.1]" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-sm">
                        <CheckCircle className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Setup payment</p>
                        <span
                          className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                            subscription.setup_payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {subscription.setup_payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {subscription.setup_payment_amount != null && subscription.setup_payment_amount !== '' && (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-900 opacity-[0.1]" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-900 text-white shadow-sm">
                        <Wallet className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Setup amount</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                          {formatCurrency(subscription.setup_payment_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-sm">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</h4>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {subscription.plan_type !== 'ONE_TIME' && subscription.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => {
                        const newPlan = subscription.plan_type === 'PREMIUM' ? 'BASIC' : 'PREMIUM'
                        if (window.confirm(`Change plan to ${newPlan}?`)) {
                          onUpdatePlan(subscription.id, newPlan)
                        }
                      }}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 sm:w-auto"
                    >
                      Switch to {subscription.plan_type === 'PREMIUM' ? 'Basic' : 'Premium'}
                    </button>
                    {subscription.cancel_at_period_end ? (
                      <button
                        onClick={() => {
                          if (window.confirm('Reactivate this subscription?')) {
                            onReactivate(subscription.id)
                          }
                        }}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm('Cancel this subscription at period end?')) {
                            onCancel(subscription.id, true)
                          }
                        }}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 sm:w-auto"
                      >
                        Cancel at Period End
                      </button>
                    )}
                  </>
                )}
                {subscription.status === 'CANCELED' && !subscription.cancel_at_period_end && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reactivate this subscription?')) {
                        onReactivate(subscription.id)
                      }
                    }}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => setIsAllocateModalOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-100 sm:w-auto"
                >
                  Allocate Add-on
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-5">
            {loadingUsage ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center text-sm text-slate-500 shadow-sm">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                Loading usage…
              </div>
            ) : subscription.plan_type === 'BASIC' && basicUsage ? (
              <BasicUsageSummary basicUsage={basicUsage} />
            ) : usage ? (
              <>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-800 text-white shadow-sm">
                      <CalendarRange className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Billing period</p>
                      <p className="mt-0.5 text-sm font-semibold text-sky-950">
                        {formatDate(usage.period_start)} — {formatDate(usage.period_end)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {usage.usage &&
                    Object.entries(usage.usage).map(([key, item]) => {
                      const { Icon, accent } = getUsageTypeVisual(key)
                      const included = Number(item.included) || 0
                      const used = Number(item.used) || 0
                      const pct =
                        included > 0
                          ? Math.min(100, (used / included) * 100)
                          : used > 0
                            ? 100
                            : 0
                      const over = used > included
                      return (
                        <div
                          key={key}
                          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                        >
                          <div
                            className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-[0.1]`}
                          />
                          <div className="relative mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
                              >
                                <Icon className="h-5 w-5" strokeWidth={2} />
                              </div>
                              <h4 className="text-sm font-bold capitalize text-slate-900">
                                {key.replace(/_/g, ' ')}
                              </h4>
                            </div>
                            {item.overage > 0 && (
                              <span className="inline-flex w-fit rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-900">
                                Overage {formatCurrency(item.overage_charge)}
                              </span>
                            )}
                          </div>
                          <div className="relative space-y-2 text-sm text-slate-600">
                            <p className="tabular-nums">
                              <span className="font-semibold text-slate-900">{used.toLocaleString()}</span>
                              <span className="text-slate-500"> / {included.toLocaleString()} included</span>
                            </p>
                            {item.overage > 0 && (
                              <p className="text-xs font-medium text-orange-700">
                                +{Number(item.overage).toLocaleString()} over included
                              </p>
                            )}
                          </div>
                          <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-[width] ${over ? 'bg-orange-500' : 'bg-indigo-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center text-sm text-slate-500">
                No usage data available
              </div>
            )}
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 sm:items-center sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-800 text-white shadow-sm">
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-950">Included limits &amp; overage</p>
                <p className="mt-1 text-xs leading-relaxed text-violet-900/80 sm:text-sm">
                  Adjust how much usage is included per period and overage pricing. Changes apply to this tenant&apos;s
                  subscription.
                </p>
              </div>
            </div>
            {loadingLimits ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center text-sm text-slate-500 shadow-sm">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                Loading limits…
              </div>
            ) : usageLimits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <p className="text-sm font-medium text-slate-700">No usage limit rows</p>
                <p className="mt-1 text-sm text-slate-500">This tenant has no configurable limit records yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {usageLimits.map((limit) => {
                  const { Icon, accent } = getUsageTypeVisual(limit.usage_type)
                  return (
                    <div
                      key={limit.id}
                      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                    >
                      <div
                        className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-[0.1]`}
                      />
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usage type</p>
                            <p className="mt-0.5 font-bold capitalize text-slate-900">
                              {String(limit.usage_type || '').replace(/_/g, ' ')}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              <span className="text-slate-500">Included</span>{' '}
                              <span className="font-semibold tabular-nums text-slate-900">
                                {limit.included_limit?.toLocaleString?.() ?? limit.included_limit}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100 sm:w-auto"
                          onClick={() => {
                            setSelectedUsageType(limit.usage_type)
                            setSelectedLimit({
                              included_limit: limit.included_limit,
                              overage_rate: parseFloat(limit.overage_rate) || 0,
                              overage_unit: limit.overage_unit || 1,
                            })
                            setIsEditLimitModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit limit
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-800 opacity-[0.08]"
                aria-hidden
              />
              <div className="relative flex items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 text-white shadow-sm">
                  <Receipt className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Invoices &amp; custom bills</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Record a one-off bill for any amount. Open bills appear below; use “Mark as paid” if settled outside
                    Stripe.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualBillOpen(true)}
                className="relative mt-4 inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:mt-0 sm:w-auto"
              >
                Send custom bill
              </button>
            </div>
            {loadingInvoices ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center text-sm text-slate-500 shadow-sm">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                Loading invoices…
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div
                      className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-800 opacity-[0.06]"
                    />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-sm">
                            <FileText className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
                            <p className="truncate text-lg font-bold text-slate-900">{invoice.invoice_number}</p>
                          </div>
                          <span
                            className={`ml-auto inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                              invoice.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : invoice.status === 'OPEN'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-xs font-medium text-slate-500">Total</p>
                            <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                              {formatCurrency(invoice.total_amount ?? invoice.amount)}{' '}
                              <span className="text-xs font-normal text-slate-500">{invoice.currency || 'USD'}</span>
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-xs font-medium text-slate-500">Base / overage</p>
                            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">
                              {formatCurrency(invoice.base_amount)} · {formatCurrency(invoice.overage_amount)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs font-medium text-slate-500">Due</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                              {formatDateTime(invoice.due_date)}
                            </p>
                          </div>
                        </div>
                        <dl className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <div className="flex flex-col gap-0.5">
                            <dt className="text-xs font-medium text-slate-500">Billing period</dt>
                            <dd className="font-medium text-slate-800">
                              {formatDateTime(invoice.period_start)} — {formatDateTime(invoice.period_end)}
                            </dd>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <dt className="text-xs font-medium text-slate-500">Issued</dt>
                            <dd className="font-medium text-slate-800">
                              {formatDateTime(invoice.created_at)}
                              {invoice.updated_at && invoice.updated_at !== invoice.created_at
                                ? ` · Updated ${formatDateTime(invoice.updated_at)}`
                                : ''}
                            </dd>
                          </div>
                          {invoice.status === 'PAID' && (
                            <div className="flex flex-col gap-0.5 sm:col-span-2">
                              <dt className="text-xs font-medium text-emerald-700">Payment</dt>
                              <dd className="font-medium text-emerald-900">
                                Paid {formatCurrency(invoice.total_amount ?? invoice.amount)}
                                {invoice.paid_at ? ` · ${formatDateTime(invoice.paid_at)}` : ' · (no timestamp stored)'}
                              </dd>
                            </div>
                          )}
                          {invoice.status === 'OPEN' && (
                            <div className="flex flex-col gap-0.5 sm:col-span-2">
                              <dt className="text-xs font-medium text-amber-800">Outstanding</dt>
                              <dd className="font-bold tabular-nums text-amber-950">
                                {formatCurrency(invoice.total_amount ?? invoice.amount)}
                              </dd>
                            </div>
                          )}
                          {invoice.usage_breakdown?.super_admin_note && (
                            <div className="flex flex-col gap-0.5 sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                              <dt className="text-xs font-medium text-slate-500">Note</dt>
                              <dd className="text-slate-800">{invoice.usage_breakdown.super_admin_note}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center text-sm text-slate-500">
                No invoices found
              </div>
            )}
          </div>
        )}

        {isModal && (
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 sm:w-auto"
            >
              Close
            </button>
          </div>
        )}
      </div>
  )

  return (
    <>
    {isModal ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        {panel}
      </div>
    ) : (
      panel
    )}

    {isEditLimitModalOpen && selectedLimit && selectedUsageType && (
      <EditUsageLimitModal
        selectedUsageType={selectedUsageType}
        selectedLimit={selectedLimit}
        setSelectedLimit={setSelectedLimit}
        onClose={() => setIsEditLimitModalOpen(false)}
        onSave={handleUpdateUsageLimit}
        limitSaving={limitSaving}
      />
    )}

    {isManualBillOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Send custom bill</h3>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setIsManualBillOpen(false)}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Creates an invoice for this tenant for the amount you specify.
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                rows={2}
                value={billDescription}
                onChange={(e) => setBillDescription(e.target.value)}
                placeholder="Shown on invoice record"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Due in (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={billDueDays}
                onChange={(e) => setBillDueDays(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={billMarkPaid}
                onChange={(e) => setBillMarkPaid(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Mark as paid now (e.g. paid outside the app)
            </label>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setIsManualBillOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={submitManualBill}
              disabled={billSubmitting}
            >
              {billSubmitting ? 'Saving…' : 'Create bill'}
            </button>
          </div>
        </div>
      </div>
    )}

    {isAllocateModalOpen && (
      <AllocateAddonModal
        tenantId={subscription.tenant_id}
        onClose={() => setIsAllocateModalOpen(false)}
        showToast={showToast}
        onAllocated={() => {
          fetchUsageLimits()
          onRefresh(subscription.id)
        }}
      />
    )}
    </>
  )
}

// Allocate Add-on Modal
function AllocateAddonModal({ tenantId, onClose, showToast, onAllocated }) {
  const [usageType, setUsageType] = useState('AI_QUERIES')
  const [allocQueries, setAllocQueries] = useState('1000')
  const [allocPrice, setAllocPrice] = useState('20.00')
  const [allocCurrency, setAllocCurrency] = useState('USD')
  const [allocating, setAllocating] = useState(false)

  const { Icon: UsageIcon, accent, label: usageLabel } = getUsageAllocationVisual(usageType)
  const unitsLabel =
    usageType === 'STORAGE' ? 'Units (MB)' : usageType === 'DOCUMENTS' ? 'Units (documents)' : 'Units'

  const handleAllocate = async () => {
    const queries = parseInt(allocQueries, 10)
    const price = parseFloat(allocPrice)
    if (!tenantId || isNaN(queries) || queries <= 0 || isNaN(price) || price < 0) {
      showToast('Enter valid queries and price', 'error')
      return
    }
    setAllocating(true)
    try {
      await axios.post(`${API_URL}/api/subscriptions/query-addons`, {
        tenant_id: tenantId,
        usage_type: usageType,
        allocated_queries: queries,
        price_amount: price,
        currency: allocCurrency,
      })
      showToast('Add-on allocated. Tenant admin can complete payment in Subscription tab.', 'success')
      onAllocated?.()
      onClose?.()
    } catch (e) {
      showToast('Failed to allocate add-on: ' + (e.response?.data?.detail || e.message), 'error')
    } finally {
      setAllocating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/15 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white to-indigo-50/30" />
        <div className="relative p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white shadow-md">
                <PackagePlus className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Allocate add-on</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Extra usage billed at your price. The tenant admin pays from their subscription page.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div
              className={`pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-[0.1]`}
            />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
                >
                  <UsageIcon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                  <p className="text-base font-bold text-slate-900">{usageLabel}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    <span className="font-semibold tabular-nums text-slate-800">{allocQueries || '—'}</span> units ·{' '}
                    <span className="font-semibold tabular-nums text-slate-800">{allocPrice || '0'}</span>{' '}
                    {allocCurrency}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <div className="min-w-[6.5rem] rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Units</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900">{allocQueries || '—'}</p>
                </div>
                <div className="min-w-[6.5rem] rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Price</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900">
                    {allocPrice || '0'}
                    <span className="ml-1 text-xs font-bold text-slate-500">{allocCurrency}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Usage type</p>
              <div
                role="radiogroup"
                aria-label="Usage type"
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5"
              >
                {ALLOC_USAGE_TYPE_OPTIONS.map((opt) => {
                  const sel = usageType === opt.value
                  const { Icon: OptIcon, accent: optAccent } = getUsageAllocationVisual(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setUsageType(opt.value)}
                      className={`relative flex flex-col gap-2 rounded-xl border p-3 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                        sel
                          ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-500/30'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      {sel && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${optAccent} text-white shadow-sm`}
                      >
                        <OptIcon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 pr-6">
                        <span className="block text-sm font-bold leading-tight text-slate-900">{opt.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{opt.hint}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
              <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {unitsLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={allocQueries}
                  onChange={(e) => setAllocQueries(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-lg font-bold tabular-nums text-slate-900 shadow-inner focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Amount of {usageLabel.toLowerCase()} to add to this tenant&apos;s pool.
                </p>
              </div>

              <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                  Price
                </label>
                <div className="flex flex-wrap items-stretch gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={allocPrice}
                    onChange={(e) => setAllocPrice(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-lg font-bold tabular-nums text-slate-900 shadow-inner focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2">
                    <span className="text-sm font-bold tracking-wide text-slate-700">{allocCurrency}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  One-time charge shown to the tenant admin. Currency is fixed to USD for now.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAllocate}
              disabled={allocating}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allocating ? 'Allocating…' : 'Allocate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionTab({ tenantId = null, tenantName = null, onTenantSubscriptionChanged = null } = {}) {
  if (tenantId) {
    const { showToast, ToastContainer } = useToast()
    return (
      <>
        <ToastContainer />
        <TenantEmbeddedSubscription
          tenantId={tenantId}
          tenantName={tenantName || ''}
          onChanged={onTenantSubscriptionChanged}
          showToast={showToast}
        />
      </>
    )
  }
  return <SubscriptionAdminList />
}
