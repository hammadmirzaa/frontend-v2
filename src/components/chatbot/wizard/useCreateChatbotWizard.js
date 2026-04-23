import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import config from '../../../config'
import { mapToneToPersonality, normalizeWebsiteUrlForIngest, validateChatbotName } from './wizardConstants'
import { formatApiErrorDetail } from '../../../utils/formatApiError'
import { useAuth } from '../../../contexts/AuthContext'

const API_URL = config.API_URL

export function useCreateChatbotWizard(showToast) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [chatbotId, setChatbotId] = useState(null)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [widgetTitle, setWidgetTitle] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [tone, setTone] = useState('neutral')
  const [systemInstructions, setSystemInstructions] = useState('')
  const [templates, setTemplates] = useState({})
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(true)

  const [guardrailName, setGuardrailName] = useState('')
  const [restrictPii, setRestrictPii] = useState(true)
  const [restrictFinancial, setRestrictFinancial] = useState(true)
  const [restrictMedical, setRestrictMedical] = useState(false)
  const [restrictLegal, setRestrictLegal] = useState(true)
  const [customRestrictionLines, setCustomRestrictionLines] = useState([])
  const [createdGuardrailId, setCreatedGuardrailId] = useState(null)

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [manualKbOpen, setManualKbOpen] = useState(true)
  const [manualKbText, setManualKbText] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const [embedCode, setEmbedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chatbots/templates/system-prompts`)
        if (!cancelled) {
          setTemplates(response.data || {})
        }
      } catch {
        if (!cancelled) setTemplates({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleTemplateChange = useCallback(async (templateName) => {
    setSelectedTemplate(templateName)
    if (!templateName) return
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
    } catch (e) {
      showToast(formatApiErrorDetail(e, 'Failed to load template'), 'error')
    }
  }, [showToast, user?.tenant_id, companyName, agentName])

  const setSystemInstructionsFromUI = useCallback((value) => {
    setSystemInstructions(value)
    setSelectedTemplate('')
  }, [])

  const addCustomRestrictionLine = useCallback((text) => {
    const t = String(text || '').trim()
    if (!t) return
    setCustomRestrictionLines((prev) => [...prev, t])
  }, [])

  const removeCustomRestrictionLine = useCallback((index) => {
    setCustomRestrictionLines((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const persistBasicInfo = useCallback(async () => {
    const err = validateChatbotName(name)
    if (err) {
      showToast(err, 'error')
      return false
    }

    const personality = {
      ...mapToneToPersonality(tone),
      welcome_message: initialMessage.trim() || undefined,
    }

    const widget_config = {
      position: 'right',
      primary_color: '#009B9B',
      secondary_color: '#008486',
      title: widgetTitle.trim() || 'Chat Assistant',
    }

    setBusy(true)
    try {
      if (chatbotId) {
        await axios.put(`${API_URL}/api/chatbots/${chatbotId}`, {
          name: name.trim(),
          company_name: companyName.trim() || undefined,
          agent_name: agentName.trim() || undefined,
          system_instructions: systemInstructions.trim() || null,
          personality,
          widget_config,
        })
      } else {
        const res = await axios.post(`${API_URL}/api/chatbots/`, {
          name: name.trim(),
          company_name: companyName.trim() || undefined,
          agent_name: agentName.trim() || undefined,
          system_instructions: systemInstructions.trim() || undefined,
          personality,
        })
        const id = res.data.id
        setChatbotId(id)
        await axios.put(`${API_URL}/api/chatbots/${id}`, { widget_config })
      }
      return true
    } catch (e) {
      showToast(formatApiErrorDetail(e, 'Could not save chatbot'), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }, [name, companyName, agentName, systemInstructions, tone, initialMessage, widgetTitle, chatbotId, showToast])

  const persistGuardrails = useCallback(async () => {
    const id = chatbotId
    if (!id) return false

    const gName = guardrailName.trim()
    const gErr = validateChatbotName(gName)
    if (gErr) {
      showToast('Guardrail name: ' + gErr, 'error')
      return false
    }

    const customRestrictionText = customRestrictionLines
      .map((s) => String(s).trim())
      .filter(Boolean)
      .join('\n\n')

    const content_restrictions = {
      no_pii: restrictPii,
      no_financial: restrictFinancial,
      no_medical: restrictMedical,
      no_legal: restrictLegal,
      custom_restriction: customRestrictionText,
    }
    const hasRestriction =
      restrictPii ||
      restrictFinancial ||
      restrictMedical ||
      restrictLegal ||
      Boolean(customRestrictionText)

    if (!hasRestriction) {
      showToast('Select at least one restriction or add a custom one.', 'error')
      return false
    }

    const payload = {
      name: gName,
      description: '',
      content_restrictions,
      is_active: true,
    }

    setBusy(true)
    try {
      if (createdGuardrailId) {
        await axios.put(`${API_URL}/api/guardrails/${createdGuardrailId}`, payload)
      } else {
        const gr = await axios.post(`${API_URL}/api/guardrails/`, payload)
        setCreatedGuardrailId(gr.data.id)
        try {
          await axios.post(`${API_URL}/api/chatbots/${id}/guardrails/${gr.data.id}`)
        } catch (assignErr) {
          if (assignErr.response?.status !== 400) throw assignErr
        }
      }
      return true
    } catch (e) {
      showToast(formatApiErrorDetail(e, 'Could not save guardrails'), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }, [
    chatbotId,
    createdGuardrailId,
    guardrailName,
    restrictPii,
    restrictFinancial,
    restrictMedical,
    restrictLegal,
    customRestrictionLines,
    showToast,
  ])

  const uploadFiles = useCallback(
    async (files) => {
      const id = chatbotId
      if (!id || !files?.length) return true

      setBusy(true)
      try {
        const formData = new FormData()
        files.forEach((f) => formData.append('files', f))
        await axios.post(`${API_URL}/api/documents/upload?chatbot_id=${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return true
      } catch (e) {
        showToast(formatApiErrorDetail(e, 'Upload failed'), 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [chatbotId, showToast]
  )

  const uploadManualKnowledge = useCallback(async () => {
    const id = chatbotId
    const text = manualKbText.trim()
    if (!id || !text) return true

    const blob = new Blob([text], { type: 'text/plain' })
    const file = new File([blob], 'manual-knowledge.txt', { type: 'text/plain' })
    return uploadFiles([file])
  }, [chatbotId, manualKbText, uploadFiles])

  const ingestWebsiteUrlIfAny = useCallback(async () => {
    const id = chatbotId
    const raw = websiteUrl.trim()
    if (!raw || !id) return true

    const url = normalizeWebsiteUrlForIngest(raw)
    if (!url) {
      showToast('Please enter a valid website URL (e.g. https://example.com or www.example.com)', 'error')
      return false
    }

    setBusy(true)
    try {
      await axios.post(`${API_URL}/api/documents/ingest-url`, {
        url,
        chatbot_id: id,
        library_id: null,
      })
      showToast('Website URL added. Content is being processed.', 'success')
      setWebsiteUrl('')
      return true
    } catch (e) {
      showToast(formatApiErrorDetail(e, 'Could not add website URL'), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }, [chatbotId, websiteUrl, showToast])

  useEffect(() => {
    if (step !== 3 || !chatbotId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/embed/code/${chatbotId}`)
        if (!cancelled) setEmbedCode(res.data.embed_code || '')
      } catch {
        if (!cancelled) setEmbedCode('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, chatbotId])

  const handleNext = async () => {
    if (step === 0) {
      const ok = await persistBasicInfo()
      if (ok) setStep(1)
      return
    }
    if (step === 1) {
      const ok = await persistGuardrails()
      if (!ok) return
      setStep(2)
      return
    }
    if (step === 2) {
      const files = uploadedFiles.map((u) => u.file)
      if (files.length) {
        const up = await uploadFiles(files)
        if (!up) return
      }
      const manualOk = await uploadManualKnowledge()
      if (!manualOk) return
      const urlOk = await ingestWebsiteUrlIfAny()
      if (!urlOk) return
      setStep(3)
    }
  }

  const handleSkip = () => {
    if (step === 1) setStep(2)
    else if (step === 2) setStep(3)
  }

  const handleBack = () => {
    if (step <= 0) return
    setStep((s) => s - 1)
  }

  const handleCopy = () => {
    if (!embedCode) return
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onFilePick = (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setUploadedFiles((prev) => [
      ...prev,
      ...list.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      })),
    ])
    e.target.value = ''
  }

  const onDropZoneDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const list = Array.from(e.dataTransfer?.files || [])
    if (!list.length) return
    setUploadedFiles((prev) => [
      ...prev,
      ...list.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      })),
    ])
  }

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((x) => x.id !== id))
  }

  const showSkip = step === 1 || step === 2

  return {
    step,
    busy,
    chatbotId,
    fileInputRef,
    embedCode,
    copied,
    showSkip,
    basic: {
      name,
      setName,
      companyName,
      setCompanyName,
      agentName,
      setAgentName,
      widgetTitle,
      setWidgetTitle,
      initialMessage,
      setInitialMessage,
      tone,
      setTone,
      systemInstructions,
      setSystemInstructions: setSystemInstructionsFromUI,
      templates,
      selectedTemplate,
      handleTemplateChange,
      advancedOpen,
      setAdvancedOpen,
    },
    guardrails: {
      guardrailName,
      setGuardrailName,
      restrictPii,
      setRestrictPii,
      restrictFinancial,
      setRestrictFinancial,
      restrictMedical,
      setRestrictMedical,
      restrictLegal,
      setRestrictLegal,
      customRestrictionLines,
      addCustomRestrictionLine,
      removeCustomRestrictionLine,
    },
    knowledge: {
      uploadedFiles,
      manualKbOpen,
      setManualKbOpen,
      manualKbText,
      setManualKbText,
      websiteUrl,
      setWebsiteUrl,
      onFilePick,
      onDropZoneDrop,
      removeFile,
    },
    handleNext,
    handleSkip,
    handleBack,
    handleCopy,
  }
}
