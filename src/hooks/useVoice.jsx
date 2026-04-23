import { useState, useRef, useEffect, useCallback } from 'react'

const DEFAULT_VOICE_STORAGE_KEY = 'chatbot_default_voice'
const CHATBOT_TAB_VOICE_STORAGE_KEY = 'chatbot_tab_voice'

/**
 * Custom hook for voice input/output functionality
 * Uses Web Speech API for speech-to-text and text-to-speech
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.voiceOverride - Override voice (for plugin.js or specific contexts)
 * @param {boolean} options.useDefault - Use default voice (true) or context-specific (false)
 */
export function useVoice(options = {}) {
  const { voiceOverride = null, useDefault = true } = options
  const [isListening, setIsListening] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice, setSelectedVoiceState] = useState(null)
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const selectedVoiceRef = useRef(null)

  // Helper function to get default voice
  const getDefaultVoice = useCallback(() => {
    if (!window.speechSynthesis) return null
    
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return null
    
    // Try to load default voice from localStorage
    const defaultVoiceName = localStorage.getItem(DEFAULT_VOICE_STORAGE_KEY)
    if (defaultVoiceName) {
      const defaultVoice = voices.find(v => v.name === defaultVoiceName)
      if (defaultVoice) return defaultVoice
    }
    
    // Preferred voice names (you can customize these)
    const preferredVoices = [
      'Google US English',      // Chrome default
      'Microsoft Zira - English (United States)',  // Edge default
      'Samantha',               // macOS
      'Karen',                  // macOS
      'Alex',                   // macOS
      'Microsoft David - English (United States)',  // Edge alternative
    ]
    
    // Try to find a preferred voice
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferredName))
      if (voice) return voice
    }
    
    // Try to find a female voice (often sounds more natural for assistants)
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('karen'))
    )
    if (femaleVoice) return femaleVoice
    
    // Fallback to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'))
    if (englishVoice) return englishVoice
    
    // Last resort: first available voice
    return voices[0]
  }, [])
  
  // Helper function to get and select a voice based on context
  const getSelectedVoice = useCallback((voiceName = null) => {
    if (!window.speechSynthesis) return null
    
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return null
    
    // Priority 1: Voice override (for plugin.js or specific contexts)
    if (voiceOverride) {
      const overrideVoice = voices.find(v => 
        v.name === voiceOverride.name || 
        v.name === voiceOverride ||
        (typeof voiceOverride === 'string' && v.name.includes(voiceOverride))
      )
      if (overrideVoice) return overrideVoice
    }
    
    // Priority 2: Explicit voice name provided
    if (voiceName) {
      const voice = voices.find(v => v.name === voiceName || v.name.includes(voiceName))
      if (voice) return voice
    }
    
    // Priority 3: Context-specific voice (ChatbotTab override)
    if (!useDefault) {
      const contextVoiceName = localStorage.getItem(CHATBOT_TAB_VOICE_STORAGE_KEY)
      if (contextVoiceName) {
        const contextVoice = voices.find(v => v.name === contextVoiceName)
        if (contextVoice) return contextVoice
      }
    }
    
    // Priority 4: Default voice
    const defaultVoice = getDefaultVoice()
    if (defaultVoice) return defaultVoice
    
    // Last resort: return null if no voice found
    return null
  }, [voiceOverride, useDefault, getDefaultVoice])
  
  // Set default voice (applies to all contexts unless overridden)
  const setDefaultVoice = useCallback((voice) => {
    if (!voice) return false
    
    try {
      // Verify voice is still available
      const voices = window.speechSynthesis.getVoices()
      const voiceExists = voices.find(v => v.name === voice.name)
      
      if (!voiceExists) {
        return false
      }
      
      localStorage.setItem(DEFAULT_VOICE_STORAGE_KEY, voice.name)
      return true
    } catch (error) {
      console.error('Error setting default voice:', error)
      return false
    }
  }, [])
  
  // Set context-specific voice (for ChatbotTab)
  const setSelectedVoice = useCallback((voice) => {
    if (!voice) return false
    
    try {
      // Verify voice is still available
      const voices = window.speechSynthesis.getVoices()
      const voiceExists = voices.find(v => v.name === voice.name)
      
      if (!voiceExists) {
        return false
      }
      
      selectedVoiceRef.current = voice
      setSelectedVoiceState(voice)
      // Store context-specific voice (ChatbotTab)
      localStorage.setItem(CHATBOT_TAB_VOICE_STORAGE_KEY, voice.name)
      return true
    } catch (error) {
      console.error('Error setting voice:', error)
      return false
    }
  }, [])
  
  // Get default voice
  const getDefaultVoiceValue = useCallback(() => {
    return getDefaultVoice()
  }, [getDefaultVoice])

  // Check if browser supports Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechSynthesis = window.speechSynthesis

    if (SpeechRecognition && SpeechSynthesis) {
      setIsSupported(true)
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      // Load voices (voices may not be available immediately)
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        
        const voice = getSelectedVoice()
        if (voice) {
          selectedVoiceRef.current = voice
          setSelectedVoiceState(voice)
          console.log('Selected voice:', voice.name)
        }
      }
      
      // Load voices immediately if available
      loadVoices()
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          // User stopped speaking, use the transcript we have
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      console.warn('Web Speech API is not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [getSelectedVoice, voiceOverride, useDefault])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleVoiceMode = () => {
    setIsVoiceMode(prev => !prev)
    if (isListening) {
      stopListening()
    }
    setTranscript('')
  }

  const speak = useCallback((text) => {
    if (!isVoiceMode) return

    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()

      // Use the selected voice from state/ref, or get default
      let voiceToUse = selectedVoiceRef.current || selectedVoice || getSelectedVoice()
      
      if (voiceToUse) {
        // Verify voice is still available
        const voices = window.speechSynthesis.getVoices()
        const voiceExists = voices.find(v => v.name === voiceToUse.name)
        
        if (!voiceExists) {
          // Voice no longer available, get a new default
          voiceToUse = getSelectedVoice()
          if (voiceToUse) {
            selectedVoiceRef.current = voiceToUse
            setSelectedVoiceState(voiceToUse)
          }
        } else {
          selectedVoiceRef.current = voiceToUse
        }
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = 'en-US'
      
      // Set the selected voice if available
      if (voiceToUse) {
        utterance.voice = voiceToUse
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        // Return error info for handling
        return { error: event.error, message: 'Failed to speak with selected voice' }
      }

      window.speechSynthesis.speak(utterance)
      synthesisRef.current = utterance
    }
  }, [isVoiceMode, getSelectedVoice, selectedVoice])

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  return {
    isListening,
    isVoiceMode,
    transcript,
    isSupported,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    setDefaultVoice,
    getDefaultVoice: getDefaultVoiceValue,
    startListening,
    stopListening,
    toggleVoiceMode,
    speak,
    stopSpeaking,
    setTranscript,
  }
}

