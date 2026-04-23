import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  CreditCard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { useDashboardSearch } from '../contexts/DashboardSearchContext'
import { SearchInput } from './ui/SearchInput'
import { cn } from '../utils/cn'

const ICON_STROKE = 1.75

/**
 * Profile menu: tenant admins get Settings, Billings, Manage Team, WhatsApp + Sign out.
 * Other tenant users: Settings + Sign out. Super users: Sign out only.
 */
export default function DashboardTopNav({
  pageTitle,
  user,
  collapsed: _collapsed,
  onToggleSidebar: _onToggleSidebar,
  searchPlaceholder = 'Search here...',
  isSuperUser = false,
  isTenantAdmin = false,
  blockedTabs = [],
  onNavigate,
  logout,
}) {
  const location = useLocation()
  const { query, setQuery } = useDashboardSearch()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuWrapRef = useRef(null)

  useEffect(() => {
    setQuery('')
  }, [location.pathname, location.search, setQuery])

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleDown = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const isBlocked = (tabId) => blockedTabs.includes(tabId)

  const navigateTab = (tabId) => {
    setMenuOpen(false)
    if (onNavigate) onNavigate(tabId)
  }

  const tenantMenuItems =
    !isSuperUser && isTenantAdmin
      ? [
          { tab: 'subscription', label: 'Billings and Plan', Icon: CreditCard },
          { tab: 'admin', label: 'Manage Team', Icon: Users },
        ]
      : []

  const showSettings = !isSuperUser

  const handleLogout = () => {
    setMenuOpen(false)
    if (logout) logout()
  }

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-4 py-6 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 shrink-0 items-center">
        <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">{pageTitle}</h1>
      </div>

      <div className="order-3 flex min-w-0 flex-1 basis-full items-center justify-end sm:order-none sm:basis-auto">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-md rounded-sm"
          dashboardInput
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={ICON_STROKE} />
        </button>
        <div className="hidden h-8 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />

        <div className="relative z-[60]" ref={menuWrapRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex max-w-[min(100vw-8rem,220px)] items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors focus:outline-none focus-visible:ring-2 sm:max-w-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-sm font-semibold text-brand-teal">
              {(user?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 max-sm:hidden">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 shrink-0 text-gray-500 transition-transform sm:block',
                menuOpen && 'rotate-180'
              )}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </button>

              {menuOpen ? (
            <div
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full z-[70] mt-2 w-[min(calc(100vw-2rem),17rem)] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            >
              {showSettings && (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isBlocked('settings')}
                  onClick={() => navigateTab('settings')}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50',
                    isBlocked('settings') && 'cursor-not-allowed opacity-45 hover:bg-transparent'
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={ICON_STROKE} />
                  Settings
                </button>
              )}

              {!isSuperUser &&
                tenantMenuItems.map(({ tab, label, Icon }) => (
                  <button
                    key={tab}
                    type="button"
                    role="menuitem"
                    disabled={isBlocked(tab)}
                    onClick={() => navigateTab(tab)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50',
                      isBlocked(tab) && 'cursor-not-allowed opacity-45 hover:bg-transparent'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={ICON_STROKE} />
                    {label}
                  </button>
                ))}

              {(showSettings || (!isSuperUser && tenantMenuItems.length > 0)) && (
                <div className="my-1 border-t border-gray-100" aria-hidden />
              )}

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
