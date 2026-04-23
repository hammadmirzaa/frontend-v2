/**
 * Human-readable title for the dashboard top nav from tab + route.
 */
export function getDashboardPageTitle({ pathname, searchParams, activeTab, isSuperUser }) {
  if (pathname.includes('/tenants/new')) {
    return 'New organization'
  }
  if (pathname.match(/\/dashboard\/tenants\/[^/]+$/) && !pathname.endsWith('/tenants')) {
    return 'Organization'
  }
  if (pathname.endsWith('/tenants') || pathname.endsWith('/tenants/')) {
    return 'Tenants'
  }

  const tab = activeTab || searchParams.get('tab') || (isSuperUser ? 'dashboards' : 'playground')

  const titles = {
    playground: 'Playground',
    chatbots: 'Chatbots',
    guardrails: 'Guardrails',
    libraries: 'Knowledge Base',
    leads: 'Leads',
    followups: 'Follow Ups',
    history: 'Conversations',
    admin: 'Manage Team',
    whatsapp: 'WhatsApp Automation',
    subscription: 'Billings and Plan',
    settings: 'Settings',
    dashboards: 'Dashboards',
    'system-prompts': 'Agents',
    'tool-prompts': 'Tools',
    tenants: 'Tenants',
  }

  return titles[tab] || 'MeiChat'
}
