import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Save,
  Settings,
  Languages,
  ChevronDown,
  Pencil,
  Copy,
  Check,
  MessageCircle,
  Shield,
  FileText,
  SlidersHorizontal,
  Trash2,
  Plus,
} from 'lucide-react'
import axios from 'axios'
import config from '../config'
import Modal from './Modal'
import Spinner from './Spinner'
import { useToast } from '../hooks/useToast'
import { formatApiErrorDetail } from '../utils/formatApiError'
import { Button, GuardrailFormModal, Pagination, SelectDropdown, SearchInput, Table } from './ui'
import TextField from './form/TextField'
import { mapToneToPersonality } from './chatbot/wizard/wizardConstants'
import ToneOfVoiceSelector from './chatbot/wizard/ToneOfVoiceSelector'
import { useAuth } from '../contexts/AuthContext'
import EmptyState from './EmptyState'
import ManualKnowledgeEntryView from './ManualKnowledgeEntryView'
import { formatDateDMY } from '../utils/formatDateDMY'
import { COLORS } from '../lib/designTokens'
import { cycleTableSort } from '../utils/tableSort'
import { cn } from '../utils/cn'

const API_URL = config.API_URL
const ACCEPT_UPLOAD = '.pdf,.doc,.docx,.txt,.csv,.tsv,.xls,.xlsx,.json'
/** Paginate guardrails / knowledge tables inside chatbot detail */
const DETAIL_TABLE_PAGE_SIZE = 6

function toneFromPersonality(personality) {
  if (!personality) return 'neutral'
  if (personality.persona_type === 'friendly') return 'friendly'
  if (personality.tone_config?.language_style === 'formal') return 'formal'
  return 'neutral'
}

export default function ChatbotDetailView({ chatbotId, onBack, onChatbotUpdated }) {
  const { user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const [activeTab, setActiveTab] = useState('customization')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingGuardrails, setSavingGuardrails] = useState(false)

  const [chatbot, setChatbot] = useState(null)
  const [chatbotName, setChatbotName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [systemInstructions, setSystemInstructions] = useState('')
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'right',
    primary_color: '#059A9F',
    secondary_color: '#e1ffc7',
    title: 'Chat Assistant',
    voice: null,
  })
  const [personality, setPersonality] = useState({
    persona_type: 'professional',
    tone_config: { emoji_usage: 'minimal', response_length: 'moderate', language_style: 'professional' },
    welcome_message: '',
    re_engagement_message: '',
    follow_up_questions_enabled: true,
  })

  const [tone, setTone] = useState('neutral')
  const [widgetTitle, setWidgetTitle] = useState('Chat Assistant')
  const [initialMessage, setInitialMessage] = useState('')
  const [templates, setTemplates] = useState({})
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('English (United States)')
  const [supportedLanguages, setSupportedLanguages] = useState('')

  const [documents, setDocuments] = useState([])
  const [documentsQuery, setDocumentsQuery] = useState('')
  const [createKnowledgeModalOpen, setCreateKnowledgeModalOpen] = useState(false)
  const [createKnowledgeStep, setCreateKnowledgeStep] = useState('pick')
  const [createKnowledgeInputMode, setCreateKnowledgeInputMode] = useState('upload')
  const [manualKnowledgeEditorOpen, setManualKnowledgeEditorOpen] = useState(false)
  const [createKnowledgeDragOver, setCreateKnowledgeDragOver] = useState(false)
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [limitMessage, setLimitMessage] = useState(
    'Document limit reached. Please upgrade your plan or purchase additional units.',
  )
  const [uploading, setUploading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)
  const createKnowledgeFileInputRef = useRef(null)

  const [guardrails, setGuardrails] = useState([])
  const [allGuardrails, setAllGuardrails] = useState([])
  const [guardrailsQuery, setGuardrailsQuery] = useState('')
  const [guardrailEditorOpen, setGuardrailEditorOpen] = useState(false)
  const [guardrailEditMode, setGuardrailEditMode] = useState('create')
  const [guardrailPickerOpen, setGuardrailPickerOpen] = useState(false)
  const [guardrailPickerQuery, setGuardrailPickerQuery] = useState('')
  const [pendingGuardrailId, setPendingGuardrailId] = useState(null)
  const [updatingGuardrailId, setUpdatingGuardrailId] = useState(null)
  const [guardrailFilterOpen, setGuardrailFilterOpen] = useState(false)
  const [guardrailFilterLinkedChatbot, setGuardrailFilterLinkedChatbot] = useState('all')
  const [guardrailFilterStatus, setGuardrailFilterStatus] = useState('all')
  const [guardrailFilterFromDate, setGuardrailFilterFromDate] = useState('')
  const [guardrailFilterToDate, setGuardrailFilterToDate] = useState('')
  const [guardrailTableSort, setGuardrailTableSort] = useState({ column: null, dir: null })
  const [knowledgeTableSort, setKnowledgeTableSort] = useState({ column: null, dir: null })
  const [guardrailListPage, setGuardrailListPage] = useState(1)
  const [knowledgeListPage, setKnowledgeListPage] = useState(1)
  const [guardrailId, setGuardrailId] = useState(null)
  const [guardrailName, setGuardrailName] = useState('')
  const [guardrailApplyTo, setGuardrailApplyTo] = useState('linked')
  const [guardrailStatus, setGuardrailStatus] = useState('active')
  const [restrictPii, setRestrictPii] = useState(false)
  const [restrictFinancial, setRestrictFinancial] = useState(false)
  const [restrictMedical, setRestrictMedical] = useState(false)
  const [restrictLegal, setRestrictLegal] = useState(false)
  const [customRestriction, setCustomRestriction] = useState('')

  const [embedCode, setEmbedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const [basicInfoSectionOpen, setBasicInfoSectionOpen] = useState(true)
  const [widgetSectionOpen, setWidgetSectionOpen] = useState(true)
  const [systemInstructionsSectionOpen, setSystemInstructionsSectionOpen] = useState(true)
  const [languageSectionOpen, setLanguageSectionOpen] = useState(true)

  const tabs = [
    { id: 'customization', label: 'Customization' },
    { id: 'guardrails', label: 'Guardrails' },
    { id: 'knowledge', label: 'Knowledge Base' },
  ]

  useEffect(() => {
    fetchChatbot()
    fetchEmbedCode()
    fetchTemplates()
  }, [chatbotId])

  useEffect(() => {
    if (activeTab === 'knowledge') {
      fetchDocuments()
      return
    }
    if (activeTab === 'guardrails') {
      fetchGuardrails()
    }
  }, [activeTab, chatbotId])

  const hydrateFromChatbot = (chatbotData) => {
    setChatbot(chatbotData)
    setChatbotName(chatbotData.name || '')
    setCompanyName(chatbotData.company_name != null ? String(chatbotData.company_name) : '')
    setAgentName(chatbotData.agent_name != null ? String(chatbotData.agent_name) : '')
    setSystemInstructions(chatbotData.system_instructions || '')

    const nextWidgetConfig = {
      position: chatbotData.widget_config?.position || 'right',
      primary_color: chatbotData.widget_config?.primary_color || '#059A9F',
      secondary_color: chatbotData.widget_config?.secondary_color || '#e1ffc7',
      title: chatbotData.widget_config?.title || 'Chat Assistant',
      voice: chatbotData.widget_config?.voice || null,
    }
    setWidgetConfig(nextWidgetConfig)
    setWidgetTitle(nextWidgetConfig.title)

    const nextPersonality = {
      persona_type: chatbotData.personality?.persona_type || 'professional',
      tone_config: {
        emoji_usage: chatbotData.personality?.tone_config?.emoji_usage || 'minimal',
        response_length: chatbotData.personality?.tone_config?.response_length || 'moderate',
        language_style: chatbotData.personality?.tone_config?.language_style || 'professional',
      },
      welcome_message: chatbotData.personality?.welcome_message || '',
      re_engagement_message: chatbotData.personality?.re_engagement_message || '',
      follow_up_questions_enabled: chatbotData.personality?.follow_up_questions_enabled !== false,
    }
    setPersonality(nextPersonality)
    setInitialMessage(nextPersonality.welcome_message || '')
    setTone(toneFromPersonality(nextPersonality))

    if (Array.isArray(chatbotData.documents)) {
      setDocuments(chatbotData.documents)
    }

    const guardrailList = Array.isArray(chatbotData.guardrails) ? chatbotData.guardrails : []
    setGuardrails(guardrailList)
    const firstGuardrail = guardrailList[0] || null
    setGuardrailId(firstGuardrail?.id || null)
    setGuardrailName(firstGuardrail?.name || '')
    setGuardrailApplyTo('linked')
    setGuardrailStatus(firstGuardrail?.is_active === false ? 'inactive' : 'active')
    setRestrictPii(Boolean(firstGuardrail?.content_restrictions?.no_pii))
    setRestrictFinancial(Boolean(firstGuardrail?.content_restrictions?.no_financial))
    setRestrictMedical(Boolean(firstGuardrail?.content_restrictions?.no_medical))
    setRestrictLegal(Boolean(firstGuardrail?.content_restrictions?.no_legal))
    setCustomRestriction(firstGuardrail?.content_restrictions?.custom_restriction || '')
  }

  const fetchChatbot = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/${chatbotId}?include_details=true`)
      hydrateFromChatbot(response.data)
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load chatbot'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents/?chatbot_id=${chatbotId}`)
      setDocuments(response.data)
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load documents'), 'error')
    }
  }

  /** Merge chatbot-linked guardrails (subset of fields) with full rows from GET /api/guardrails/ for dates & consistency */
  const mergeLinkedGuardrails = (linkedPartial, allFull) => {
    if (!Array.isArray(linkedPartial) || linkedPartial.length === 0) return []
    const byId = new Map((allFull || []).map((g) => [g.id, g]))
    return linkedPartial.map((p) => {
      const full = byId.get(p.id)
      return full ? { ...full, ...p } : p
    })
  }

  const fetchGuardrails = async () => {
    try {
      const [chatbotRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/api/chatbots/${chatbotId}?include_details=true`),
        axios.get(`${API_URL}/api/guardrails/`),
      ])
      const allList = Array.isArray(allRes.data) ? allRes.data : []
      setAllGuardrails(allList)
      const linked = Array.isArray(chatbotRes.data?.guardrails) ? chatbotRes.data.guardrails : []
      const guardrailList = mergeLinkedGuardrails(linked, allList)
      setGuardrails(guardrailList)
      const firstGuardrail = guardrailList[0] || null
      setGuardrailId(firstGuardrail?.id || null)
      setGuardrailName(firstGuardrail?.name || '')
      setGuardrailApplyTo('linked')
      setGuardrailStatus(firstGuardrail?.is_active === false ? 'inactive' : 'active')
      setRestrictPii(Boolean(firstGuardrail?.content_restrictions?.no_pii))
      setRestrictFinancial(Boolean(firstGuardrail?.content_restrictions?.no_financial))
      setRestrictMedical(Boolean(firstGuardrail?.content_restrictions?.no_medical))
      setRestrictLegal(Boolean(firstGuardrail?.content_restrictions?.no_legal))
      setCustomRestriction(firstGuardrail?.content_restrictions?.custom_restriction || '')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load guardrails'), 'error')
    }
  }

  const fetchAllGuardrails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/guardrails/`)
      const list = Array.isArray(response.data) ? response.data : []
      setAllGuardrails(list)
      return list
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load available guardrails'), 'error')
      return []
    }
  }

  const fetchEmbedCode = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/embed/code/${chatbotId}`)
      setEmbedCode(response.data.embed_code)
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load embed code'), 'error')
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/templates/system-prompts`)
      setTemplates(response.data || {})
    } catch {
      setTemplates({})
    }
  }

  const handleTemplateChange = async (templateName) => {
    setSelectedTemplate(templateName)
    if (!templateName) {
      return
    }
    try {
      const params = new URLSearchParams({
        company_name: companyName.trim() || 'our company',
        agent_name: agentName.trim() || 'AI Assistant',
      })
      if (user?.tenant_id) {
        params.set('tenant_id', user.tenant_id)
      }
      const response = await axios.get(
        `${API_URL}/api/chatbots/templates/system-prompts/${templateName}?${params.toString()}`
      )
      setSystemInstructions(response.data?.content || '')
      showToast('Template loaded. You can edit it before saving.', 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to load template'), 'error')
    }
  }

  const handleSaveCustomization = async () => {
    setSaving(true)
    try {
      const mappedTone = mapToneToPersonality(tone)
      await axios.put(`${API_URL}/api/chatbots/${chatbotId}`, {
        name: chatbotName,
        company_name: companyName.trim() || undefined,
        agent_name: agentName.trim() || undefined,
        system_instructions: systemInstructions,
        widget_config: {
          ...widgetConfig,
          position: widgetConfig.position || 'right',
          primary_color: widgetConfig.primary_color || '#059A9F',
          secondary_color: widgetConfig.secondary_color || '#e1ffc7',
          voice: widgetConfig.voice || null,
          title: widgetTitle || 'Chat Assistant',
        },
        personality: {
          ...personality,
          ...mappedTone,
          welcome_message: initialMessage || null,
        },
      })
      await fetchChatbot()
      showToast('Settings saved successfully', 'success')
      if (onChatbotUpdated) onChatbotUpdated()
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to save settings'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const uploadFiles = async (files) => {
    if (files.length === 0) return false

    setUploading(true)
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('chatbot_id', chatbotId)

    try {
      const response = await axios.post(`${API_URL}/api/documents/upload?chatbot_id=${chatbotId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await fetchDocuments()
      if (response.data?.length > 0) {
        setDocumentsQuery('')
      }
      const count = response.data.length
      showToast(`${count} document${count > 1 ? 's' : ''} uploaded and ${count > 1 ? 'are' : 'is'} being processed!`, 'success')
      if (onChatbotUpdated) onChatbotUpdated()
      return true
    } catch (error) {
      const code = error?.response?.data?.error_code || error?.response?.data?.detail?.error_code
      const msg = error?.response?.data?.message || error?.response?.data?.detail?.message
      if (code === 'DOCUMENT_LIMIT_REACHED') {
        setLimitMessage(msg || limitMessage)
        setLimitModalOpen(true)
      } else {
        showToast(formatApiErrorDetail(error, 'Failed to upload document(s)'), 'error')
      }
      return false
    } finally {
      setUploading(false)
    }
  }

  const handleFilePick = async (e) => {
    const files = Array.from(e.target.files || [])
    await uploadFiles(files)
    e.target.value = ''
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    setDeleting(documentToDelete.id)
    try {
      await axios.delete(`${API_URL}/api/documents/${documentToDelete.id}`)
      await fetchDocuments()
      showToast('Document deleted successfully', 'success')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      showToast('Failed to delete document', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleSaveGuardrail = async () => {
    if (!guardrailName.trim()) {
      showToast('Guardrail name is required', 'error')
      return
    }

    setSavingGuardrails(true)
    try {
      const payload = {
        name: guardrailName.trim(),
        description: '',
        allowed_topics: [],
        denied_topics: [],
        content_restrictions: {
          no_pii: restrictPii,
          no_financial: restrictFinancial,
          no_medical: restrictMedical,
          no_legal: restrictLegal,
          custom_restriction: customRestriction,
        },
        is_active: guardrailStatus === 'active',
      }

      let savedGuardrailId = guardrailId
      if (savedGuardrailId) {
        await axios.put(`${API_URL}/api/guardrails/${savedGuardrailId}`, payload)
      } else {
        const response = await axios.post(`${API_URL}/api/guardrails/`, payload)
        savedGuardrailId = response.data.id
        setGuardrailId(savedGuardrailId)
      }

      if (savedGuardrailId) {
        try {
          await axios.post(`${API_URL}/api/chatbots/${chatbotId}/guardrails/${savedGuardrailId}`)
        } catch {
          // already attached or no-op; keep UX simple
        }
      }

      await fetchGuardrails()
      setGuardrailEditorOpen(false)
      setGuardrailEditMode('create')
      showToast('Guardrails saved successfully', 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to save guardrails'), 'error')
    } finally {
      setSavingGuardrails(false)
    }
  }

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEditGuardrail = (guardrail) => {
    setGuardrailEditMode('edit')
    setGuardrailId(guardrail.id)
    setGuardrailName(guardrail.name || '')
    setGuardrailApplyTo('linked')
    setGuardrailStatus(guardrail?.is_active === false ? 'inactive' : 'active')
    setRestrictPii(Boolean(guardrail.content_restrictions?.no_pii))
    setRestrictFinancial(Boolean(guardrail.content_restrictions?.no_financial))
    setRestrictMedical(Boolean(guardrail.content_restrictions?.no_medical))
    setRestrictLegal(Boolean(guardrail.content_restrictions?.no_legal))
    setCustomRestriction(guardrail.content_restrictions?.custom_restriction || '')
    setGuardrailEditorOpen(true)
  }

  const resetGuardrailForm = () => {
    setGuardrailId(null)
    setGuardrailName('')
    setGuardrailApplyTo('linked')
    setGuardrailStatus('active')
    setRestrictPii(false)
    setRestrictFinancial(false)
    setRestrictMedical(false)
    setRestrictLegal(false)
    setCustomRestriction('')
  }

  const openCreateGuardrailModal = () => {
    resetGuardrailForm()
    setGuardrailEditMode('create')
    setGuardrailEditorOpen(true)
  }

  const handleGuardrailFormChange = (field, value) => {
    if (field === 'name') setGuardrailName(value)
    if (field === 'applyTo') setGuardrailApplyTo(value)
    if (field === 'status') setGuardrailStatus(value)
    if (field === 'restrictPii') setRestrictPii(Boolean(value))
    if (field === 'restrictFinancial') setRestrictFinancial(Boolean(value))
    if (field === 'restrictMedical') setRestrictMedical(Boolean(value))
    if (field === 'restrictLegal') setRestrictLegal(Boolean(value))
    if (field === 'customRestriction') setCustomRestriction(value)
  }

  const handleDeleteGuardrail = async (guardrail) => {
    try {
      await axios.delete(`${API_URL}/api/chatbots/${chatbotId}/guardrails/${guardrail.id}`)
      await fetchGuardrails()
      showToast('Guardrail removed successfully', 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to remove guardrail'), 'error')
    }
  }

  const openGuardrailPicker = async () => {
    const availableGuardrails = await fetchAllGuardrails()
    const attachedIds = new Set(guardrails.map((g) => g.id))
    const firstAvailable = availableGuardrails.find((g) => !attachedIds.has(g.id))
    setPendingGuardrailId(firstAvailable?.id ?? null)
    setGuardrailPickerQuery('')
    setGuardrailPickerOpen(true)
  }

  const attachSelectedGuardrail = async () => {
    if (!pendingGuardrailId) return
    try {
      await axios.post(`${API_URL}/api/chatbots/${chatbotId}/guardrails/${pendingGuardrailId}`)
      await fetchGuardrails()
      setGuardrailPickerOpen(false)
      setPendingGuardrailId(null)
      showToast('Guardrail added successfully', 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to add guardrail'), 'error')
    }
  }

  const handleUnaddGuardrailFromModal = async (guardrail) => {
    setUpdatingGuardrailId(guardrail.id)
    try {
      await axios.delete(`${API_URL}/api/chatbots/${chatbotId}/guardrails/${guardrail.id}`)
      await fetchGuardrails()
      showToast('Guardrail removed successfully', 'success')
    } catch (error) {
      showToast(formatApiErrorDetail(error, 'Failed to remove guardrail'), 'error')
    } finally {
      setUpdatingGuardrailId(null)
    }
  }

  const openCreateKnowledgeModal = () => {
    setManualKnowledgeEditorOpen(false)
    setCreateKnowledgeStep('pick')
    setCreateKnowledgeInputMode('upload')
    setCreateKnowledgeDragOver(false)
    setCreateKnowledgeModalOpen(true)
  }

  const closeCreateKnowledgeModal = () => {
    if (uploading) return
    setCreateKnowledgeModalOpen(false)
    setCreateKnowledgeStep('pick')
    setCreateKnowledgeDragOver(false)
    setCreateKnowledgeInputMode('upload')
  }

  const closeManualKnowledgeEditor = () => {
    setManualKnowledgeEditorOpen(false)
    setCreateKnowledgeStep('pick')
    setCreateKnowledgeInputMode('upload')
  }

  const goNextFromCreateKnowledgePick = () => {
    if (createKnowledgeInputMode === 'manual') {
      setCreateKnowledgeModalOpen(false)
      setManualKnowledgeEditorOpen(true)
      return
    }
    setCreateKnowledgeStep('upload')
  }

  const handleCreateKnowledgeFilePick = async (e) => {
    const files = Array.from(e.target.files || [])
    const ok = await uploadFiles(files)
    e.target.value = ''
    if (ok) {
      closeCreateKnowledgeModal()
      setKnowledgeListPage(1)
    }
  }

  const handleCreateKnowledgeDrop = async (e) => {
    e.preventDefault()
    setCreateKnowledgeDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    const ok = await uploadFiles(files)
    if (ok) {
      closeCreateKnowledgeModal()
      setKnowledgeListPage(1)
    }
  }

  const onGuardrailTableSort = useCallback((columnId) => {
    setGuardrailTableSort((prev) => cycleTableSort(columnId, prev))
  }, [])

  const onKnowledgeTableSort = useCallback((columnId) => {
    setKnowledgeTableSort((prev) => cycleTableSort(columnId, prev))
  }, [])

  const filteredGuardrails = guardrails.filter((g) => {
    const matchesSearch = (g.name || '').toLowerCase().includes(guardrailsQuery.trim().toLowerCase())
    const rowActive = g.is_active !== false
    const matchesStatus =
      guardrailFilterStatus === 'all' ||
      (guardrailFilterStatus === 'active' ? rowActive : !rowActive)
    const matchesLinked =
      guardrailFilterLinkedChatbot === 'all' ||
      (guardrailFilterLinkedChatbot === 'linked' ? true : false)

    const dateValue = g.updated_at || g.created_at
    const rowDate = dateValue ? new Date(dateValue) : null
    const fromDate = guardrailFilterFromDate ? new Date(`${guardrailFilterFromDate}T00:00:00`) : null
    const toDate = guardrailFilterToDate ? new Date(`${guardrailFilterToDate}T23:59:59`) : null
    const matchesDate = !rowDate || ((!fromDate || rowDate >= fromDate) && (!toDate || rowDate <= toDate))

    return matchesSearch && matchesStatus && matchesLinked && matchesDate
  })

  const sortedFilteredGuardrails = useMemo(() => {
    const list = [...filteredGuardrails]
    const { column, dir } = guardrailTableSort
    if (!column || !dir) return list
    const mult = dir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (column === 'updated') {
        const da = new Date(a.updated_at || a.created_at || 0).getTime()
        const db = new Date(b.updated_at || b.created_at || 0).getTime()
        return mult * (da - db)
      }
      return mult * String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    })
    return list
  }, [filteredGuardrails, guardrailTableSort])

  const guardrailTotalPages = Math.max(1, Math.ceil(sortedFilteredGuardrails.length / DETAIL_TABLE_PAGE_SIZE))

  const paginatedGuardrailsForTable = useMemo(() => {
    const start = (guardrailListPage - 1) * DETAIL_TABLE_PAGE_SIZE
    return sortedFilteredGuardrails.slice(start, start + DETAIL_TABLE_PAGE_SIZE)
  }, [sortedFilteredGuardrails, guardrailListPage])

  const attachedGuardrailIds = new Set(guardrails.map((g) => g.id))
  const filteredAllGuardrails = allGuardrails.filter((g) =>
    (g.name || '').toLowerCase().includes(guardrailPickerQuery.trim().toLowerCase())
  )
  const guardrailPickerPrimaryText = pendingGuardrailId ? 'Add Guardrail' : 'Done'

  const guardrailsColumns = [
    { id: 'name', label: 'Name', accessor: 'name', sortable: true },
    {
      id: 'scope',
      label: 'Linked Chatbot',
      render: () => chatbotName || 'Chatbot name',
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const active = row.is_active !== false
        return (
          <span
            className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
            style={active ? { backgroundColor: '#e8f9ee', color: '#28a745' } : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
          >
            {active ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    {
      id: 'updated',
      label: 'Last Updated',
      sortable: true,
      render: (row) => formatDateDMY(row.updated_at || row.created_at),
    },
    {
      id: 'actions',
      label: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleEditGuardrail(row)}
            className="rounded-md p-1.5 text-gray-800 transition-colors hover:bg-gray-100"
            aria-label="Edit guardrail"
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteGuardrail(row)}
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
            aria-label="Delete guardrail"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ]

  const filteredDocuments = documents.filter((d) =>
    (d.filename || '').toLowerCase().includes(documentsQuery.trim().toLowerCase())
  )

  const sortedFilteredDocuments = useMemo(() => {
    const list = [...filteredDocuments]
    const { column, dir } = knowledgeTableSort
    if (!column || !dir) return list
    const mult = dir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (column === 'uploaded_at') {
        const ta = new Date(a.uploaded_at || a.updated_at || a.created_at || 0).getTime()
        const tb = new Date(b.uploaded_at || b.updated_at || b.created_at || 0).getTime()
        return mult * (ta - tb)
      }
      return mult * String(a.filename || '').localeCompare(String(b.filename || ''), undefined, {
        sensitivity: 'base',
      })
    })
    return list
  }, [filteredDocuments, knowledgeTableSort])

  const knowledgeTotalPages = Math.max(1, Math.ceil(sortedFilteredDocuments.length / DETAIL_TABLE_PAGE_SIZE))

  const paginatedKnowledgeForTable = useMemo(() => {
    const start = (knowledgeListPage - 1) * DETAIL_TABLE_PAGE_SIZE
    return sortedFilteredDocuments.slice(start, start + DETAIL_TABLE_PAGE_SIZE)
  }, [sortedFilteredDocuments, knowledgeListPage])

  const knowledgeColumns = [
    { id: 'name', label: 'File name', accessor: 'filename', sortable: true },
    {
      id: 'filetype',
      label: 'File type',
      render: (row) => {
        const fileType = row.source_type === 'url'
          ? 'URL'
          : (row.filename?.split('.').pop() || 'Document').toUpperCase()
        return fileType
      },
    },
    {
      id: 'uploaded_at',
      label: 'Uploaded at',
      sortable: true,
      render: (row) => formatDateDMY(row.uploaded_at || row.updated_at || row.created_at),
    },
    {
      id: 'actions',
      label: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setDocumentToDelete(row)
              setDeleteModalOpen(true)
            }}
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
            aria-label="Delete document"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ]

  useEffect(() => {
    setGuardrailListPage(1)
  }, [guardrailsQuery, guardrailFilterStatus, guardrailFilterLinkedChatbot, guardrailFilterFromDate, guardrailFilterToDate])

  useEffect(() => {
    setKnowledgeListPage(1)
  }, [documentsQuery])

  useEffect(() => {
    setGuardrailListPage((p) => Math.min(p, guardrailTotalPages))
  }, [guardrailTotalPages])

  useEffect(() => {
    setKnowledgeListPage((p) => Math.min(p, knowledgeTotalPages))
  }, [knowledgeTotalPages])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white">
        <p className="text-gray-500">Chatbot not found</p>
      </div>
    )
  }

  return (
    <>
      <ToastContainer />

      <div className="relative flex min-h-[min(720px,calc(100vh-5rem))] flex-1 flex-col bg-[#FAFBFC] p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBack} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{chatbotName || 'Chatbot Name'}</h2>
              <p className="mt-1 text-sm font-medium text-gray-400">tailor your assistants look, tone, and voice to fit your brand.</p>
            </div>
          </div>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
              chatbot.is_active ? 'border-gray-200 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${chatbot.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {chatbot.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.id ? 'bg-brand-teal text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {activeTab === 'customization' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setBasicInfoSectionOpen((o) => !o)}
                  aria-expanded={basicInfoSectionOpen}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50/80 ${
                    basicInfoSectionOpen ? 'border-b border-gray-200 pb-4' : ''
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-normal font-semibold text-gray-900">
                    <FileText className="h-5 w-5 shrink-0 text-gray-600" />
                    Basic Information
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      basicInfoSectionOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                    aria-hidden
                  />
                </button>

                {basicInfoSectionOpen ? (
                  <div className="space-y-5 px-6 pb-6 pt-6">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-900">Chatbot Name</label>
                      <TextField
                        value={chatbotName}
                        onChange={(e) => setChatbotName(e.target.value)}
                        placeholder="eg. Customer Support Bot"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-900">Company Name</label>
                      <TextField
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="eg. Customer Support"
                        autoComplete="organization"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-900">Agent Name</label>
                      <TextField
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="eg. Customer Support"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-normal font-bold text-gray-900 ">Embed Code</h3>
                <div className="relative mt-4 rounded-xl bg-gray-50/90 p-5 sm:p-6">
                  <pre className="overflow-x-auto pr-12 text-sm font-medium text-gray-800 ">
                    {embedCode || 'Loading...'}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyEmbedCode}
                    disabled={!embedCode}
                    className="absolute right-4 top-4 rounded-lg p-2 text-brand-teal transition-colors hover:bg-white disabled:opacity-40"
                    aria-label="Copy embed code"
                  >
                    {copied ? <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} /> : <Copy className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />}
                  </button>
                </div>
                <p className="mt-4 text-xs font-normal text-gray-400">
                  Paste this code into your website's HTML where you want the chatbot to appear
                </p>

                <h4 className="mt-4 text-normal font-bold text-gray-900 ">Preview</h4>
                <div className="relative mt-3 min-h-[140px] rounded-xl bg-gray-50/90 sm:min-h-[160px]">
                  <div className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#00DAB2] text-white shadow-sm">
                    <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-gray-400 ">Floating chatbot button will appear in the bottom-right corner</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setWidgetSectionOpen((o) => !o)}
                  aria-expanded={widgetSectionOpen}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50/80 ${
                    widgetSectionOpen ? 'border-b border-gray-200 pb-4' : ''
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-normal font-semibold text-gray-900 ">
                    <Settings className="h-5 w-5 shrink-0 text-gray-600" />
                    Widget Settings
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      widgetSectionOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                    aria-hidden
                  />
                </button>

                {widgetSectionOpen ? (
                <div className="space-y-5 px-6 pb-6 pt-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-900">Title</label>
                    <TextField value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-900">Initial Message</label>
                    <TextField multiline rows={3} value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} />
                  </div>

                  <SelectDropdown
                    variant="field"
                    label="Position"
                    value={widgetConfig.position}
                    onChange={(value) => setWidgetConfig((prev) => ({ ...prev, position: value }))}
                    options={[
                      { value: 'right', label: 'Bottom Right (default)' },
                      { value: 'left', label: 'Bottom Left' },
                    ]}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-900">Primary Color</label>
                      <div className="flex items-center gap-2 rounded-lg bg-gray-50/90 px-3 py-1.5">
                        <input
                          type="text"
                          value={widgetConfig.primary_color}
                          onChange={(e) => setWidgetConfig((prev) => ({ ...prev, primary_color: e.target.value }))}
                          className="w-full bg-transparent text-sm text-gray-900 outline-none"
                        />
                        <label className="cursor-pointer rounded-md p-1 text-brand-teal hover:bg-white">
                          <img src="/svgs/chatbot/drop.svg" alt="Pencil" className="w-10 h-10" />
                          <input
                            type="color"
                            value={widgetConfig.primary_color}
                            onChange={(e) => setWidgetConfig((prev) => ({ ...prev, primary_color: e.target.value }))}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-900">Secondary Color</label>
                      <div className="flex items-center gap-2 rounded-lg bg-gray-50/90 px-3 py-1.5">
                        <input
                          type="text"
                          value={widgetConfig.secondary_color}
                          onChange={(e) => setWidgetConfig((prev) => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-full bg-transparent text-sm text-gray-900 outline-none"
                        />
                        <label className="cursor-pointer rounded-md p-1 text-brand-teal hover:bg-white">
                          <img src="/svgs/chatbot/drop.svg" alt="Pencil" className="w-10 h-10" />
                          <input
                            type="color"
                            value={widgetConfig.secondary_color}
                            onChange={(e) => setWidgetConfig((prev) => ({ ...prev, secondary_color: e.target.value }))}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <SelectDropdown
                    variant="field"
                    label="Voice"
                    value={widgetConfig.voice || 'adam'}
                    onChange={(value) => setWidgetConfig((prev) => ({ ...prev, voice: value }))}
                    options={[
                      { value: 'adam', label: 'Adam' },
                      { value: 'alloy', label: 'Alloy' },
                      { value: 'echo', label: 'Echo' },
                      { value: 'fable', label: 'Fable' },
                    ]}
                  />
                </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white  shadow-sm">
                <button
                  type="button"
                  onClick={() => setSystemInstructionsSectionOpen((o) => !o)}
                  aria-expanded={systemInstructionsSectionOpen}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50/80 ${
                    systemInstructionsSectionOpen ? 'border-b border-gray-200 pb-4' : ''
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-normal font-semibold text-gray-900">
                    <FileText className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />
                    System Instructions
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      systemInstructionsSectionOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                    aria-hidden
                  />
                </button>

                {systemInstructionsSectionOpen ? (
                <div className="space-y-5 px-6 pb-6 pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <p className="text-sm leading-relaxed text-gray-700 lg:max-w-2xl lg:flex-1">
                      Customize how your chatbot behaves. You can select a template or write your own instructions.
                    </p>
                    <div className="w-full flex justify-end shrink-0 lg:w-72 xl:w-80">
                      <SelectDropdown
                        variant="pill"
                        value={selectedTemplate}
                        onChange={handleTemplateChange}
                        className="max-w-[205px] w-full !rounded-lg "
                        options={[
                          { value: '', label: 'Select Template' },
                          ...Object.keys(templates)
                            .sort((a, b) => a.localeCompare(b))
                            .map((name) => ({
                              value: name,
                              label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                            })),
                        ]}
                      />
                    </div>
                  </div>

                  <ToneOfVoiceSelector value={tone} onChange={setTone} />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-900">Instructions</label>
                    <TextField
                      multiline
                      rows={6}
                      value={systemInstructions}
                      onChange={(e) => {
                        setSystemInstructions(e.target.value)
                        setSelectedTemplate('')
                      }}
                      placeholder="Write your guidance here, focusing on one topic for each piece. You can test this guidance in the preview without saving or enabling it."
                    />
                    {selectedTemplate ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Template selected: {selectedTemplate.replace(/_/g, ' ')}
                      </p>
                    ) : null}
                  </div>
                </div>
                ) : null}
              </div>

              {/* <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setLanguageSectionOpen((o) => !o)}
                  aria-expanded={languageSectionOpen}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50/80 ${
                    languageSectionOpen ? 'border-b border-gray-200 pb-4' : ''
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-normal font-semibold text-gray-900">
                    <Languages className="h-5 w-5 shrink-0 text-gray-600" />
                    Language Settings
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      languageSectionOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                    aria-hidden
                  />
                </button>

                {languageSectionOpen ? (
                <div className="space-y-4 px-6 pb-6 pt-6">
                  <SelectDropdown
                    variant="field"
                    label="Primary Language (Required)"
                    value={primaryLanguage}
                    onChange={setPrimaryLanguage}
                    options={[
                      { value: 'English (United States)', label: 'English (United States)' },
                      { value: 'English (United Kingdom)', label: 'English (United Kingdom)' },
                      { value: 'Hindi', label: 'Hindi' },
                      { value: 'French', label: 'French' },
                    ]}
                    helperText="The default language used by the agent when no language is detected."
                  />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-900">Supported Languages</label>
                    <TextField
                      value={supportedLanguages}
                      onChange={(e) => setSupportedLanguages(e.target.value)}
                      placeholder="Add supported languages..."
                    />
                    <p className="mt-2 text-xs text-gray-500">Search the languages this agent can respond in.</p>
                  </div>
                </div>
                ) : null}
              </div> */}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { fetchChatbot(); fetchEmbedCode() }}>
                  Reset to Defaults
                </Button>
                <Button type="button" variant="primary" onClick={handleSaveCustomization} disabled={saving} className='py-2.5 px-5 !rounded-lg' >
                  {saving && <Spinner size="sm" className="text-white" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'guardrails' && (
            guardrails.length === 0 ? (
              <EmptyState
                title="Your chatbot’s Guardrails are not configured."
                description="Guardrails define the boundaries of what your bot can and cannot say, ensuring safe, compliant, and brand-aligned interactions."
              >
                <div className="mt-6">
                  <Button type="button" variant="primary" onClick={openGuardrailPicker}>
                    Setup Now
                  </Button>
                </div>
              </EmptyState>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Guardrails</h3>
                      <p className="mt-1 text-sm text-gray-500">Manage rules that control what your chatbot can and can't do.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <SearchInput
                        value={guardrailsQuery}
                        onChange={(e) => setGuardrailsQuery(e.target.value)}
                        className="w-full sm:w-[240px]"
                      />
                      <Button type="button" variant="primary" onClick={openGuardrailPicker}>
                        Add Guardrail
                      </Button>
                    </div>
                  </div>

                  {sortedFilteredGuardrails.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                      No guardrails match your search or filters.
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200">
                      <Table
                        columns={guardrailsColumns}
                        data={paginatedGuardrailsForTable}
                        keyExtractor={(row) => row.id}
                        minWidth="860px"
                        onSortClick={onGuardrailTableSort}
                        sortColumnId={guardrailTableSort.column}
                        sortDirection={guardrailTableSort.dir}
                        className="!pt-0 sm:!pt-0"
                      />
                      <Pagination
                        currentPage={guardrailListPage}
                        totalPages={guardrailTotalPages}
                        onPageChange={setGuardrailListPage}
                        className="shrink-0 border-t border-gray-100 px-4 pb-4 sm:px-6"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'knowledge' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_UPLOAD}
                multiple
                onChange={handleFilePick}
              />
              {documents.length === 0 ? (
                <EmptyState
                  title="Your chatbot’s Knowledge Base is not configured."
                  description="The Knowledge Base provides the reference documents and data your bot uses to answer questions accurately and consistently."
                >
                  <div className="mt-6">
                    <Button type="button" variant="primary" onClick={openCreateKnowledgeModal}>
                      Setup Now
                    </Button>
                  </div>
                </EmptyState>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Attached Files</h3>
                      <p className="mt-1 text-sm text-gray-500">Here you can explore your uploaded files.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <SearchInput
                        value={documentsQuery}
                        onChange={(e) => setDocumentsQuery(e.target.value)}
                        className="w-full sm:w-[240px]"
                      />
                      {/* <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                        Filters
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </button> */}
                      <Button type="button" variant="primary" onClick={openCreateKnowledgeModal}>
                        Create Knowledge
                      </Button>
                      {/* <Button
                        type="button"
                        variant="primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2"
                      >
                        {uploading ? <Spinner size="sm" className="text-white" /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                        {uploading ? 'Uploading...' : 'Add Document'}
                      </Button> */}
                    </div>
                  </div>

                  {sortedFilteredDocuments.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">No files match your search.</div>
                  ) : (
                    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200">
                      <Table
                        columns={knowledgeColumns}
                        data={paginatedKnowledgeForTable}
                        keyExtractor={(row) => row.id}
                        minWidth="820px"
                        onSortClick={onKnowledgeTableSort}
                        sortColumnId={knowledgeTableSort.column}
                        sortDirection={knowledgeTableSort.dir}
                        className="!pt-0 sm:!pt-0"
                      />
                      <Pagination
                        currentPage={knowledgeListPage}
                        totalPages={knowledgeTotalPages}
                        onPageChange={setKnowledgeListPage}
                        className="shrink-0 border-t border-gray-100 px-4 pb-4 sm:px-6"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {manualKnowledgeEditorOpen ? (
          <div className="absolute inset-0 z-[35] overflow-y-auto rounded-xl bg-[#F4F5F7] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
            <ManualKnowledgeEntryView
              chatbotId={chatbotId}
              chatbotName={chatbotName}
              showToast={showToast}
              onClose={closeManualKnowledgeEditor}
              onSaved={async () => {
                await fetchDocuments()
                showToast('Manual knowledge saved and is being processed.', 'success')
                setDocumentsQuery('')
                setKnowledgeListPage(1)
                if (onChatbotUpdated) onChatbotUpdated()
              }}
              onLimitReached={(msg) => {
                setLimitMessage(msg || limitMessage)
                setLimitModalOpen(true)
              }}
              limitMessage={limitMessage}
            />
          </div>
        ) : null}
      </div>

      {/* Delete Document Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDocumentToDelete(null)
        }}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{documentToDelete?.filename}</strong>?
          </p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setDeleteModalOpen(false)
                setDocumentToDelete(null)
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={deleting === documentToDelete?.id}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteDocument}
              disabled={deleting === documentToDelete?.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {deleting === documentToDelete?.id && <Spinner size="sm" className="text-white" />}
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>

      <GuardrailFormModal
        isOpen={guardrailEditorOpen}
        mode={guardrailEditMode}
        submitting={savingGuardrails}
        onClose={() => {
          setGuardrailEditorOpen(false)
          setGuardrailEditMode('create')
        }}
        onSubmit={handleSaveGuardrail}
        form={{
          name: guardrailName,
          applyTo: guardrailApplyTo,
          status: guardrailStatus,
          restrictPii,
          restrictFinancial,
          restrictMedical,
          restrictLegal,
          customRestriction,
        }}
        onChange={handleGuardrailFormChange}
      />

      <Modal
        isOpen={guardrailFilterOpen}
        onClose={() => setGuardrailFilterOpen(false)}
        title="Filter Options"
        panelClassName="max-w-lg"
      >
        <div className="space-y-5">
          <SelectDropdown
            label="Linked Chatbots"
            value={guardrailFilterLinkedChatbot}
            onChange={setGuardrailFilterLinkedChatbot}
            options={[
              { value: 'all', label: 'All Chatbots' },
              { value: 'linked', label: chatbotName || 'This Chatbot' },
            ]}
          />

          <div>
            <p className="mb-2 text-sm font-bold text-gray-900">Chatbots</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
              ].map((item) => {
                const selected = guardrailFilterStatus === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                    style={{
                      borderColor: selected ? COLORS.BRAND : COLORS.GRAY_200,
                      color: selected ? COLORS.BRAND : COLORS.GRAY_600,
                      backgroundColor: selected ? COLORS.BRAND_ACTIVE_BG : '#ffffff',
                    }}
                    onClick={() => setGuardrailFilterStatus(item.id)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-gray-900">Date Range</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField type="date" value={guardrailFilterFromDate} onChange={(e) => setGuardrailFilterFromDate(e.target.value)} />
              <TextField type="date" value={guardrailFilterToDate} onChange={(e) => setGuardrailFilterToDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setGuardrailFilterLinkedChatbot('all')
                setGuardrailFilterStatus('all')
                setGuardrailFilterFromDate('')
                setGuardrailFilterToDate('')
              }}
            >
              Clear Filters
            </Button>
            <Button type="button" variant="primary" onClick={() => setGuardrailFilterOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={guardrailPickerOpen}
        onClose={() => {
          setGuardrailPickerOpen(false)
          setPendingGuardrailId(null)
        }}
        title="Add Guardrail"
        panelClassName="max-w-2xl"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={guardrailPickerQuery}
              onChange={(e) => setGuardrailPickerQuery(e.target.value)}
              placeholder="Search guardrails..."
              className="w-full max-w-none sm:max-w-md"
            />
            {/* <Button
              type="button"
              variant="outline"
              onClick={() => {
                setGuardrailPickerOpen(false)
                openCreateGuardrailModal()
              }}
            >
              Create Guardrail
            </Button> */}
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredAllGuardrails.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No guardrails found.</div>
            ) : (
              filteredAllGuardrails.map((guardrail) => {
                const attached = attachedGuardrailIds.has(guardrail.id)
                const selected = pendingGuardrailId === guardrail.id
                return (
                  <div
                    key={guardrail.id}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      attached
                        ? 'border-gray-200 bg-gray-50'
                        : selected
                          ? 'border-brand-teal bg-brand-teal/[0.06]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{guardrail.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{guardrail.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {attached ? (
                          <span className="text-xs font-semibold text-gray-500">Added</span>
                        ) : selected ? (
                          <span className="text-xs font-semibold text-brand-teal">Selected</span>
                        ) : null}
                        {attached ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => handleUnaddGuardrailFromModal(guardrail)}
                            disabled={updatingGuardrailId === guardrail.id}
                          >
                            {updatingGuardrailId === guardrail.id ? 'Unadding...' : 'Unadd'}
                          </Button>
                        ) : !selected ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setPendingGuardrailId(guardrail.id)}
                          >
                            Select
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setGuardrailPickerOpen(false)
                setPendingGuardrailId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (pendingGuardrailId) {
                  attachSelectedGuardrail()
                  return
                }
                setGuardrailPickerOpen(false)
              }}
            >
              {guardrailPickerPrimaryText}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={createKnowledgeModalOpen}
        onClose={closeCreateKnowledgeModal}
        title="Create Knowledge"
        subtitle={createKnowledgeStep === 'pick' ? 'Choose how you want to add knowledge to this chatbot.' : undefined}
        showCloseButton={!uploading}
        panelClassName="max-w-[640px] max-h-[min(92vh,620px)]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {createKnowledgeStep === 'pick' ? (
            <>
              <p className="text-sm text-gray-600">
                New knowledge will be attached to{' '}
                <span className="font-semibold text-gray-900">{chatbotName || 'this chatbot'}</span>.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCreateKnowledgeInputMode('manual')}
                  className={cn(
                    'flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-colors',
                    createKnowledgeInputMode === 'manual'
                      ? 'border-brand-teal shadow-sm ring-1 ring-brand-teal/15'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <img src="/svgs/knowledgebase/write-manually.svg" alt="" className="h-12 w-12" />
                  <span className="mt-3 text-sm font-semibold text-gray-900">Write manually</span>
                  <span className="mt-1 text-xs leading-relaxed text-gray-500">
                    Manually write your own specific knowledge.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateKnowledgeInputMode('upload')}
                  className={cn(
                    'flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-colors',
                    createKnowledgeInputMode === 'upload'
                      ? 'border-brand-teal shadow-sm ring-1 ring-brand-teal/15'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <img src="/svgs/knowledgebase/upload.svg" alt="" className="h-12 w-12" />
                  <span className="mt-3 text-sm font-semibold text-gray-900">Upload a Document</span>
                  <span className="mt-1 text-xs leading-relaxed text-gray-500">
                    Train your chatbot using your documents.
                  </span>
                </button>
              </div>

              <div className="mt-auto flex justify-between gap-3 border-t border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={closeCreateKnowledgeModal}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={goNextFromCreateKnowledgePick}
                  disabled={uploading}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <input
                ref={createKnowledgeFileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_UPLOAD}
                multiple
                onChange={handleCreateKnowledgeFilePick}
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Select File</p>
                <button
                  type="button"
                  onDragEnter={() => setCreateKnowledgeDragOver(true)}
                  onDragLeave={() => setCreateKnowledgeDragOver(false)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setCreateKnowledgeDragOver(true)
                  }}
                  onDrop={handleCreateKnowledgeDrop}
                  onClick={() => createKnowledgeFileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    'mt-3 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
                    createKnowledgeDragOver
                      ? 'border-brand-teal bg-brand-teal/[0.04]'
                      : 'border-gray-200 bg-gray-50/80 hover:border-gray-300',
                    uploading && 'pointer-events-none opacity-60',
                  )}
                >
                  <FileText className="h-10 w-10 text-brand-teal" strokeWidth={1.25} />
                  <span className="mt-4 text-sm font-semibold text-gray-900">
                    Click here to upload or drag your file here
                  </span>
                  <span className="mt-2 text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, TXT, and more</span>
                </button>
              </div>

              <div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateKnowledgeStep('pick')} disabled={uploading}>
                  Back
                </Button>
                <Button type="button" variant="outline" onClick={closeCreateKnowledgeModal} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => createKnowledgeFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Spinner size="sm" className="text-white" /> : null}
                  {uploading ? 'Uploading…' : 'Upload Knowledge'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} title="Document limit">
        <p className="text-sm text-gray-700">{limitMessage}</p>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={() => setLimitModalOpen(false)}>
            OK
          </Button>
        </div>
      </Modal>

    </>
  )
}

