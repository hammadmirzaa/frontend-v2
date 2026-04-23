import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { DashboardSearchProvider } from '../contexts/DashboardSearchContext'
import Sidebar from '../components/Sidebar'
import DashboardTopNav from '../components/DashboardTopNav'
import axios from 'axios'
import config from '../config'
import DashboardHome from './DashboardHome'
import TenantListPage from './tenants/TenantListPage'
import TenantCreatePage from './tenants/TenantCreatePage'
import TenantDetailPage from './tenants/TenantDetailPage'
import { getDashboardPageTitle } from '../utils/dashboardPageTitle'

const API_URL = config.API_URL

export default function Dashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isTenantPath = location.pathname.startsWith('/dashboard/tenants')

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('tab') || 'playground'
    } catch {
      return 'playground'
    }
  })
  const [selectedChatbotId, setSelectedChatbotId] = useState(null)
  const [providerKeyGate, setProviderKeyGate] = useState({ loading: false, blocked: false })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSelectChatbot = (id) => {
    setSelectedChatbotId(id)
    if (!isTenantPath) {
      navigate('/dashboard?tab=playground')
    }
    setActiveTab('playground')
  }

  const isSuperUser = user?.role === 'SUPER_USER' || user?.is_super_user
  const isAdmin = user?.role === 'ADMIN' || isSuperUser
  const isTenantUser = Boolean(user?.tenant_id) && !isSuperUser
  const roleName = (user?.role || '').toUpperCase()
  const isSales = roleName === 'SALES'
  const isManager = roleName === 'MANAGER'

  const pmPortalBlocked = (isSales || isManager) && user?.pm_sales_portal_allowed === false

  const roleAllowedTabs = pmPortalBlocked
    ? []
    : isSales
      ? ['leads', 'followups', 'history', 'settings']
      : isManager
        ? [
            'playground',
            'chatbots',
            'guardrails',
            'libraries',
            'leads',
            'followups',
            'history',
            'settings',
          ]
        : null

  const checkProviderKeysGate = useCallback(async () => {
    if (!isTenantUser) {
      setProviderKeyGate({ loading: false, blocked: false })
      return
    }

    setProviderKeyGate({ loading: true, blocked: false })
    try {
      const subscriptionResponse = await axios.get(`${API_URL}/api/tenants/${user.tenant_id}/subscription`)
      if (subscriptionResponse.data?.plan_type !== 'BASIC') {
        setProviderKeyGate({ loading: false, blocked: false })
        return
      }

      const keysResponse = await axios.get(`${API_URL}/api/tenants/${user.tenant_id}/provider-keys`)
      const hasAllRequiredKeys = Boolean(
        keysResponse.data?.PINECONE_API_KEY &&
        keysResponse.data?.PINECONE_INDEX_NAME &&
        keysResponse.data?.OPENAI_API_KEY
      )
      setProviderKeyGate({ loading: false, blocked: !hasAllRequiredKeys })
    } catch {
      setProviderKeyGate({ loading: false, blocked: false })
    }
  }, [isTenantUser, user?.tenant_id])

  useEffect(() => {
    checkProviderKeysGate()
  }, [checkProviderKeysGate])

  useEffect(() => {
    if (isTenantPath) {
      setActiveTab('tenants')
      return
    }
    const params = new URLSearchParams(location.search)
    const t = params.get('tab')

    if (isSuperUser) {
      const allowedSuper = ['dashboards', 'system-prompts', 'tool-prompts']
      if (!t || !allowedSuper.includes(t)) {
        navigate('/dashboard?tab=dashboards', { replace: true })
        return
      }
      setActiveTab(t)
      return
    }

    const normalized = t || 'playground'
    if (normalized === 'subscriptions') {
      setActiveTab('tenants')
      navigate('/dashboard/tenants', { replace: true })
      return
    }
    setActiveTab(normalized)
  }, [location.search, location.pathname, isTenantPath, isSuperUser, navigate])

  useEffect(() => {
    if (providerKeyGate.blocked && isAdmin && !isSuperUser && activeTab !== 'subscription' && !isTenantPath) {
      navigate('/dashboard?tab=subscription')
    }
  }, [providerKeyGate.blocked, isAdmin, isSuperUser, activeTab, navigate, isTenantPath])

  useEffect(() => {
    if (roleAllowedTabs && roleAllowedTabs.length > 0 && !roleAllowedTabs.includes(activeTab) && !isTenantPath) {
      navigate(`/dashboard?tab=${roleAllowedTabs[0]}`)
    }
  }, [activeTab, roleAllowedTabs, navigate, isTenantPath])

  const blockedTabs = useMemo(() => {
    const tabs = []
    if (providerKeyGate.blocked) {
      tabs.push(
        'playground',
        'chatbots',
        'guardrails',
        'leads',
        'followups',
        'history',
        'libraries',
        'admin',
        'settings',
        'subscription',
        'whatsapp'
      )
    }
    if (pmPortalBlocked) {
      tabs.push('playground', 'chatbots', 'guardrails', 'leads', 'followups', 'history', 'libraries')
    }
    return tabs
  }, [providerKeyGate.blocked, pmPortalBlocked])

  const isCurrentTabBlocked =
    pmPortalBlocked && (isSales || isManager) ? true : blockedTabs.includes(activeTab)

  const canAccessTab = (tabId) => !roleAllowedTabs || roleAllowedTabs.includes(tabId)

  const pageTitle = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return getDashboardPageTitle({
      pathname: location.pathname,
      searchParams,
      activeTab,
      isSuperUser,
    })
  }, [location.pathname, location.search, activeTab, isSuperUser])

  const handleSidebarNavigate = (tabId) => {
    if (tabId === 'tenants' && isSuperUser) {
      navigate('/dashboard/tenants')
      return
    }
    if (tabId === 'dashboards' && isSuperUser) {
      navigate('/dashboard?tab=dashboards')
      return
    }
    if (tabId === 'system-prompts' && isSuperUser) {
      navigate('/dashboard?tab=system-prompts')
      return
    }
    if (tabId === 'tool-prompts' && isSuperUser) {
      navigate('/dashboard?tab=tool-prompts')
      return
    }
    if (tabId === 'playground') {
      navigate('/dashboard')
    } else {
      navigate(`/dashboard?tab=${tabId}`)
    }
  }

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c)
  }, [])

  return (
    <DashboardSearchProvider>
      <div className="flex h-screen bg-[#FAFBFC]">
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleSidebarNavigate}
          user={user}
          blockedTabs={blockedTabs}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
        />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <DashboardTopNav
            pageTitle={pageTitle}
            user={user}
            collapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            isSuperUser={isSuperUser}
            isTenantAdmin={Boolean(user?.role === 'ADMIN' && !isSuperUser)}
            pmPortalBlocked={pmPortalBlocked}
            blockedTabs={blockedTabs}
            onNavigate={handleSidebarNavigate}
            logout={logout}
          />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="tenants/new" element={<TenantCreatePage />} />
              <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
              <Route path="tenants" element={<TenantListPage />} />
              <Route
                path="*"
                element={
                  <DashboardHome
                    activeTab={activeTab}
                    selectedChatbotId={selectedChatbotId}
                    handleSelectChatbot={handleSelectChatbot}
                    isSuperUser={isSuperUser}
                    isAdmin={isAdmin}
                    canManageDeletedChatbots={user?.role === 'ADMIN' || isSuperUser}
                    pmPortalBlocked={pmPortalBlocked}
                    isSales={isSales}
                    isManager={isManager}
                    canAccessTab={canAccessTab}
                    providerKeyGate={providerKeyGate}
                    checkProviderKeysGate={checkProviderKeysGate}
                    isCurrentTabBlocked={isCurrentTabBlocked}
                  />
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </DashboardSearchProvider>
  )
}
