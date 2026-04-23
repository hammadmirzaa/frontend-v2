import PlaygroundTab from '../components/PlaygroundTab'
import ChatbotsTab from '../components/ChatbotsTab'
import GuardrailsTab from '../components/GuardrailsTab'
import LeadsTab from '../components/LeadsTab'
import FollowUpsTab from '../components/FollowUpsTab'
import HistoryTab from '../components/HistoryTab'
import LibrariesTab from '../components/LibrariesTab'
import AdminTab from '../components/AdminTab'
import WhatsAppTab from '../components/WhatsAppTab'
import TenantSubscriptionTab from '../components/TenantSubscriptionTab'
import DashboardSettingsTab from '../components/DashboardSettingsTab'
import SuperAdminDashboardTab from '../components/SuperAdminDashboardTab'
import SystemPromptsAdminTab from '../components/SystemPromptsAdminTab'
import ToolsAdminTab from '../components/ToolsAdminTab'

export default function DashboardHome({
  activeTab,
  selectedChatbotId,
  handleSelectChatbot,
  isSuperUser,
  isAdmin,
  canManageDeletedChatbots = false,
  pmPortalBlocked,
  isSales,
  isManager,
  canAccessTab,
  providerKeyGate,
  checkProviderKeysGate,
  isCurrentTabBlocked,
}) {
  if (isSuperUser) {
    if (activeTab === 'dashboards') {
      return <SuperAdminDashboardTab />
    }
    if (activeTab === 'system-prompts') {
      return <SystemPromptsAdminTab />
    }
    if (activeTab === 'tool-prompts') {
      return <ToolsAdminTab />
    }
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">This area is not available</h2>
        <p className="text-sm text-gray-600">
          Super Admin can open <strong>Dashboards</strong>, <strong>Tenants</strong>, <strong>Agents</strong>, or{' '}
          <strong>Tools</strong> from the sidebar.
        </p>
      </div>
    )
  }

  return (
    <>
      {providerKeyGate.loading && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          Checking tenant provider key requirements...
        </div>
      )}
      {providerKeyGate.blocked && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          BASIC plan requires provider keys before product setup/actions are enabled.
        </div>
      )}
      {pmPortalBlocked && (isSales || isManager) ? (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product access is not enabled for your account</h2>
          <p className="text-sm text-gray-600">
            This tenant is not licensed for Manager or Sales portal access. Please contact your tenant administrator or
            support if you believe this is a mistake.
          </p>
        </div>
      ) : isCurrentTabBlocked ? (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-yellow-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup blocked until API keys are configured</h2>
          <p className="text-sm text-gray-600">
            {isAdmin && !isSuperUser
              ? 'Go to the Subscription tab and complete "Configure your own API keys" to unlock product actions.'
              : 'Your tenant admin must configure required API keys in Subscription before product actions are enabled.'}
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'playground' && canAccessTab('playground') && <PlaygroundTab selectedChatbotId={selectedChatbotId} />}
          {activeTab === 'chatbots' && canAccessTab('chatbots') && (
            <ChatbotsTab
              onSelectChatbot={handleSelectChatbot}
              canManageDeletedChatbots={canManageDeletedChatbots}
            />
          )}
          {activeTab === 'guardrails' && canAccessTab('guardrails') && <GuardrailsTab />}
          {activeTab === 'leads' && canAccessTab('leads') && <LeadsTab />}
          {activeTab === 'followups' && canAccessTab('followups') && <FollowUpsTab />}
          {activeTab === 'history' && canAccessTab('history') && <HistoryTab />}
          {activeTab === 'libraries' && <LibrariesTab />}
          {activeTab === 'settings' && !isSuperUser && <DashboardSettingsTab />}
          {activeTab === 'admin' && isAdmin && !isSuperUser && <AdminTab />}
          {activeTab === 'whatsapp' && (isAdmin || isSuperUser) && <WhatsAppTab />}
          {activeTab === 'subscription' && isAdmin && !isSuperUser && (
            <TenantSubscriptionTab onProviderKeysUpdated={checkProviderKeysGate} />
          )}
        </>
      )}
    </>
  )
}
