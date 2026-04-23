import { useState, useEffect } from 'react'
import { Copy, Check, Eye, RefreshCw, Settings, Save, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import config from '../config'
import Modal from './Modal'
import axios from 'axios'
import Spinner from './Spinner'
import { useVoice } from '../hooks/useVoice'
import { formatApiErrorDetail } from '../utils/formatApiError'
import { useAuth } from '../contexts/AuthContext'

const API_URL = config.API_URL

export default function EmbedPluginTab() {
  const { user } = useAuth()
  const [chatbots, setChatbots] = useState([])
  const [selectedChatbot, setSelectedChatbot] = useState(null)
  const [embedCode, setEmbedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSystemInstructions, setShowSystemInstructions] = useState(false)
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'right',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    title: 'Chat Assistant',
    voice: null  // null means use default voice
  })
  const [systemInstructions, setSystemInstructions] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [chatbotName, setChatbotName] = useState('')
  const [creating, setCreating] = useState(false)
  const { showToast, ToastContainer } = useToast()
  const [updatingChatbot, setUpdatingChatbot] = useState(null)
  const [loadingLibraries, setLoadingLibraries] = useState(false)
  const [libraries, setLibraries] = useState([])
  const [templates, setTemplates] = useState({})
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const { availableVoices } = useVoice()



  useEffect(() => {
    fetchChatbots()
    fetchLibraries()
    fetchTemplates()
  }, [])

  const fetchLibraries = async () => {
    setLoadingLibraries(true);
    try {
      const response = await axios.get(`${API_URL}/api/libraries/`)
      setLibraries(response.data)
    } catch (error) {
      console.error('Failed to fetch libraries:', error)
    } finally {
      setLoadingLibraries(false)
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/templates/system-prompts`)
      setTemplates(response.data)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }


  const fetchChatbots = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(response.data)
      if (response.data.length > 0 && !selectedChatbot) {
        setSelectedChatbot(response.data[0])
        fetchEmbedCode(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch chatbots:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLibraryName = (libraryId) => {
    if (!libraryId) return 'Public';
    const library = libraries.find(lib => lib.id === libraryId);
    return library ? library.name : 'Public';
  };

  const handleLibraryChange = async (chatbotId, libraryId) => {
    console.log('called handle library change')
    if (!libraryId) return;

    setUpdatingChatbot(chatbotId);
    try {
      await axios.patch(`${API_URL}/api/chatbots/${chatbotId}/library/${libraryId}`);

      // Fetch updated chatbots list
      const response = await axios.get(`${API_URL}/api/chatbots/`);
      setChatbots(response.data);

      // Update selectedChatbot if it's the one that was changed
      if (selectedChatbot?.id === chatbotId) {
        const updatedChatbot = response.data.find(c => c.id === chatbotId);
        if (updatedChatbot) {
          setSelectedChatbot(updatedChatbot);
        }
      }

      showToast('Chatbot library updated successfully', 'success');

    } catch (error) {
      console.error('Failed to update chatbot:', error);
      showToast('Failed to update chatbot library', 'error');
    } finally {
      setUpdatingChatbot(null);
    }
  };

  const fetchEmbedCode = async (chatbotId) => {
    try {
      const response = await axios.get(`${API_URL}/api/embed/code/${chatbotId}`)
      setEmbedCode(response.data.embed_code)
    } catch (error) {
      console.error('Failed to fetch embed code:', error)
    }
  }

  const handleChatbotChange = (chatbotId) => {
    const chatbot = chatbots.find(c => c.id === chatbotId)
    setSelectedChatbot(chatbot)
    fetchEmbedCode(chatbotId)
    // Load widget config if exists
    if (chatbot?.widget_config) {
      setWidgetConfig({
        position: chatbot.widget_config.position || 'right',
        primary_color: chatbot.widget_config.primary_color || '#667eea',
        secondary_color: chatbot.widget_config.secondary_color || '#764ba2',
        title: chatbot.widget_config.title || 'Chat Assistant',
        voice: chatbot.widget_config.voice || null
      })
    } else {
      setWidgetConfig({
        position: 'right',
        primary_color: '#667eea',
        secondary_color: '#764ba2',
        title: 'Chat Assistant',
        voice: null
      })
    }
    // Load system instructions and variables
    setSystemInstructions(chatbot?.system_instructions || '')
    setCompanyName(chatbot?.company_name || '')
    setAgentName(chatbot?.agent_name || '')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateClick = () => {
    setChatbotName('')
    setCreateModalOpen(true)
  }

  const createChatbot = async () => {
    if (!chatbotName.trim()) {
      showToast('Please enter a chatbot name', 'error')
      return
    }

    setCreating(true)
    try {
      const response = await axios.post(`${API_URL}/api/chatbots/`, { name: chatbotName.trim() })
      await fetchChatbots()
      setSelectedChatbot(response.data)
      fetchEmbedCode(response.data.id)
      showToast('Chatbot created successfully', 'success')
      setCreateModalOpen(false)
      setChatbotName('')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to create chatbot'), 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!selectedChatbot) return

    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/chatbots/${selectedChatbot.id}`, {
        widget_config: widgetConfig
      })
      const updatedChatbots = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(updatedChatbots.data)
      const updated = updatedChatbots.data.find(c => c.id === selectedChatbot.id)
      if (updated) {
        setSelectedChatbot(updated)
        // Update widget config state
        if (updated.widget_config) {
          setWidgetConfig({
            position: updated.widget_config.position || 'right',
            primary_color: updated.widget_config.primary_color || '#667eea',
            secondary_color: updated.widget_config.secondary_color || '#764ba2',
            title: updated.widget_config.title || 'Chat Assistant',
            voice: updated.widget_config.voice ?? null
          })
        }
      }
      showToast('Widget settings saved successfully', 'success')
      setShowSettings(false)
    } catch (error) {
      showToast('Failed to save widget settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSystemInstructions = async () => {
    if (!selectedChatbot) return

    setSavingInstructions(true)
    try {
      await axios.put(`${API_URL}/api/chatbots/${selectedChatbot.id}`, {
        system_instructions: systemInstructions,
        company_name: companyName || 'our company',
        agent_name: agentName || 'AI Assistant'
      })
      const updatedChatbots = await axios.get(`${API_URL}/api/chatbots/`)
      setChatbots(updatedChatbots.data)
      const updated = updatedChatbots.data.find(c => c.id === selectedChatbot.id)
      if (updated) {
        setSelectedChatbot(updated)
        setSystemInstructions(updated.system_instructions || '')
      }
      showToast('System instructions saved successfully', 'success')
    } catch (error) {
      showToast('Failed to save system instructions', 'error')
    } finally {
      setSavingInstructions(false)
    }
  }

  const handleSelectTemplate = async (templateName) => {
    try {
      const params = new URLSearchParams({
        company_name: companyName || 'our company',
        agent_name: agentName || 'AI Assistant',
      })
      if (user?.tenant_id) {
        params.set('tenant_id', user.tenant_id)
      }
      const response = await axios.get(
        `${API_URL}/api/chatbots/templates/system-prompts/${templateName}?${params.toString()}`
      )
      setSystemInstructions(response.data.content)
      setTemplateModalOpen(false)
      showToast('Template loaded. You can edit it before saving.', 'success')
    } catch (error) {
      showToast('Failed to load template', 'error')
    }
  }

  return (
    <>
      <ToastContainer />
      {/* Template Selection Modal */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title="Select agent template"
        showCloseButton={true}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            Object.entries(templates).map(([name, template]) => (
              <div
                key={name}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                onClick={() => handleSelectTemplate(name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize mb-1">
                      {name.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {template.preview}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Create Chatbot Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (!creating) {
            setCreateModalOpen(false)
            setChatbotName('')
          }
        }}
        title="Create New Chatbot"
        showCloseButton={!creating}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chatbot Name
            </label>
            <input
              type="text"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creating && chatbotName.trim()) {
                  createChatbot()
                }
              }}
              placeholder="Enter chatbot name"
              disabled={creating}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setCreateModalOpen(false)
                setChatbotName('')
              }}
              disabled={creating}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={createChatbot}
              disabled={creating || !chatbotName.trim()}
              className="px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {creating && <Spinner size="sm" className="text-white" />}
              <span>{creating ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
        </div>
      </Modal>
      <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Embed Plugin</h2>
          <p className="text-sm text-gray-500 mt-1">Generate embed code to integrate your chatbot into any website</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Chatbot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Chatbot
            </label>
            <div className="flex space-x-4">
              <select
                value={selectedChatbot?.id || ''}
                onChange={(e) => handleChatbotChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {chatbots.map((chatbot) => (
                  <option key={chatbot.id} value={chatbot.id}>
                    {chatbot.name} {!chatbot.is_active && '(Inactive)'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90"
              >
                + New
              </button>
            </div>
          </div>

          {selectedChatbot && (
            <>
              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-center h-64 relative">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center">
                        <Eye size={24} className="text-white" />
                      </div>
                      <p className="text-gray-600">Floating chatbot button will appear</p>
                      <p className="text-sm text-gray-400 mt-1">in the bottom-right corner</p>
                    </div>
                    {/* Simulated button */}
                    <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full gradient-bg shadow-lg flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Embed Code
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={embedCode}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste this code into your website's HTML where you want the chatbot to appear
                </p>
              </div>

              {/* Widget Settings */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Settings size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Widget Settings</span>
                  </div>
                  <span className="text-gray-500">{showSettings ? '▼' : '▶'}</span>
                </button>

                {showSettings && (
                  <div className="p-4 border-t border-gray-200 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <select
                        value={widgetConfig.position}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="right">Right</option>
                        <option value="left">Left</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.title}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Chat Assistant"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      The first message in the widget comes from the chatbot&apos;s Persona (Welcome message).
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={widgetConfig.primary_color}
                            onChange={(e) => setWidgetConfig({ ...widgetConfig, primary_color: e.target.value })}
                            className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={widgetConfig.primary_color}
                            onChange={(e) => setWidgetConfig({ ...widgetConfig, primary_color: e.target.value })}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="#667eea"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secondary Color
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={widgetConfig.secondary_color}
                            onChange={(e) => setWidgetConfig({ ...widgetConfig, secondary_color: e.target.value })}
                            className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={widgetConfig.secondary_color}
                            onChange={(e) => setWidgetConfig({ ...widgetConfig, secondary_color: e.target.value })}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="#764ba2"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice (Optional)
                      </label>
                      <select
                        value={widgetConfig.voice || ''}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, voice: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Use Default Voice</option>
                        {availableVoices
                          .filter(v => v.lang.startsWith('en'))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((voice) => (
                            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select a specific voice for this chatbot, or leave as "Use Default Voice" to use the global default.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      <Save size={18} />
                      <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                )}
              </div>
              {/* System Instructions */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowSystemInstructions(!showSystemInstructions)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">System Instructions</span>
                  </div>
                  {showSystemInstructions ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>

                {showSystemInstructions && (
                  <div className="p-4 border-t border-gray-200 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        Customize how your chatbot behaves. You can select a template or write your own instructions.
                      </p>
                      <button
                        onClick={() => setTemplateModalOpen(true)}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200"
                      >
                        Select Template
                      </button>
                    </div>
                    {/* Company Name and Agent Name Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Meissasoft"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used in templates as {'{company_name}'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Agent Name
                        </label>
                        <input
                          type="text"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Alex"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used in templates as {'{agent_name}'}
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      rows={10}
                      placeholder="Enter system instructions for your chatbot...&#10;&#10;You can use variables: {company_name} and {agent_name}&#10;&#10;Example:&#10;You are {agent_name}, an AI assistant for {company_name}. Your primary goal is to answer questions thoroughly and helpfully based on the provided context. Be conversational, friendly, and professional."
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {systemInstructions.length} characters
                      </p>
                      <button
                        onClick={handleSaveSystemInstructions}
                        disabled={savingInstructions}
                        className="flex items-center space-x-2 px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        <Save size={18} />
                        <span>{savingInstructions ? 'Saving...' : 'Save Instructions'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Library Settings */}
              <div className="border border-gray-200 rounded-lg">
                <div className="w-full flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">Library</span>
                  </div>
                  <select
                    onChange={(e) => handleLibraryChange(selectedChatbot.id, e.target.value)}
                    disabled={updatingChatbot === selectedChatbot.id || loadingLibraries}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedChatbot.library_id || ''}
                  >
                    <option value="" disabled>{getCurrentLibraryName(selectedChatbot.library_id)}</option>
                    <option value="public">Public</option>
                    {libraries.map(lib => (
                      <option key={lib.id} value={lib.id}>
                        {lib.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className={`text-sm mt-1 ${selectedChatbot.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedChatbot.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${API_URL}/api/chatbots/${selectedChatbot.id}/toggle`)
                      fetchChatbots()
                      showToast('Chatbot status updated', 'success')
                    } catch (error) {
                      showToast('Failed to toggle chatbot status', 'error')
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg border border-gray-300"
                >
                  <RefreshCw size={16} />
                  <span>Toggle Status</span>
                </button>
              </div>


            </>
          )}

          {chatbots.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No chatbots created yet</p>
              <button
                onClick={handleCreateClick}
                className="px-6 py-3 gradient-bg text-white rounded-lg hover:opacity-90"
              >
                Create Your First Chatbot
              </button>
            </div>
          )}
        </div>
      </div >
    </>
  )
}

