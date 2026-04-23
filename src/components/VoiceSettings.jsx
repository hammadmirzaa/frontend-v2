import { useState, useEffect } from 'react'
import { Settings, Volume2, Check, AlertCircle, RefreshCw, X } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export default function VoiceSettings({ 
  isOpen, 
  onClose, 
  availableVoices, 
  selectedVoice,
  defaultVoice = null,
  onVoiceSelect,
  onSetDefaultVoice = null,
  showDefaultOption = false
}) {
  const [filteredVoices, setFilteredVoices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [isTesting, setIsTesting] = useState(false)
  const { showToast, ToastContainer } = useToast()

  // Filter voices based on search and language
  useEffect(() => {
    let filtered = [...availableVoices]
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(voice => 
        voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.lang.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by language
    if (languageFilter !== 'all') {
      filtered = filtered.filter(voice => voice.lang.startsWith(languageFilter))
    }
    
    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    setFilteredVoices(filtered)
  }, [availableVoices, searchTerm, languageFilter])

  // Get unique languages
  const languages = [...new Set(availableVoices.map(v => v.lang.split('-')[0]))].sort()

  const handleVoiceSelect = (voice) => {
    try {
      const success = onVoiceSelect(voice)
      if (success) {
        showToast(`Voice "${voice.name}" selected successfully`, 'success')
      } else {
        showToast('Failed to select voice. The voice may no longer be available.', 'error')
      }
    } catch (error) {
      showToast(`Error selecting voice: ${error.message}`, 'error')
    }
  }

  const testVoice = (voice) => {
    if (!window.speechSynthesis) {
      showToast('Speech synthesis is not supported in this browser', 'error')
      return
    }

    if (isTesting) {
      window.speechSynthesis.cancel()
      setIsTesting(false)
      return
    }

    setIsTesting(true)
    
    try {
      const testText = 'Hello, this is a test of the voice. How do I sound?'
      const utterance = new SpeechSynthesisUtterance(testText)
      utterance.voice = voice
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = voice.lang

      utterance.onend = () => {
        setIsTesting(false)
      }

      utterance.onerror = (event) => {
        setIsTesting(false)
        let errorMessage = 'Failed to test voice'
        
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.'
            break
          case 'synthesis-failed':
            errorMessage = 'Voice synthesis failed. This voice may not be available.'
            break
          case 'synthesis-unavailable':
            errorMessage = 'Voice synthesis is unavailable. Please try another voice.'
            break
          case 'audio-busy':
            errorMessage = 'Audio system is busy. Please try again in a moment.'
            break
          case 'not-allowed':
            errorMessage = 'Audio playback is not allowed. Please check browser permissions.'
            break
          default:
            errorMessage = `Voice test failed: ${event.error || 'Unknown error'}`
        }
        
        showToast(errorMessage, 'error')
      }

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setIsTesting(false)
      showToast(`Error testing voice: ${error.message}`, 'error')
    }
  }

  const refreshVoices = () => {
    if (window.speechSynthesis) {
      // Force reload voices
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        showToast('No voices available. Please check your browser settings.', 'warning')
      } else {
        showToast(`Loaded ${voices.length} voice(s)`, 'success')
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Settings size={24} className="text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Voice Settings</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshVoices}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh voices"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Info Banner */}
            {availableVoices.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    No voices available
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Voices may still be loading. Please wait a moment and click refresh, or check your browser's speech synthesis settings.
                  </p>
                </div>
              </div>
            )}

            {/* Current Selection */}
            {selectedVoice && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 mb-1">
                  {showDefaultOption ? 'Current Voice (Chat Assistant):' : 'Current Voice:'}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-indigo-900">{selectedVoice.name}</p>
                    <p className="text-sm text-indigo-700">{selectedVoice.lang}</p>
                  </div>
                  <button
                    onClick={() => testVoice(selectedVoice)}
                    disabled={isTesting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} />
                        <span>Test Voice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Default Voice Display */}
            {showDefaultOption && defaultVoice && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Default Voice (All Chatbots):</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">{defaultVoice.name}</p>
                    <p className="text-sm text-blue-700">{defaultVoice.lang}</p>
                    <p className="text-xs text-blue-600 mt-1">This voice applies to all embedded chatbots unless overridden</p>
                  </div>
                  <button
                    onClick={() => testVoice(defaultVoice)}
                    disabled={isTesting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} />
                        <span>Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Voices
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or language..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Language
                </label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Voice List */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Available Voices ({filteredVoices.length})
              </p>
              {filteredVoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No voices found matching your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setLanguageFilter('all')
                    }}
                    className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredVoices.map((voice) => {
                    const isSelected = selectedVoice?.name === voice.name
                    return (
                      <div
                        key={`${voice.name}-${voice.lang}`}
                        className={`p-4 border rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleVoiceSelect(voice)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{voice.name}</p>
                              {isSelected && (
                                <Check size={18} className="text-indigo-600" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <span>{voice.lang}</span>
                              {voice.default && (
                                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                  Default
                                </span>
                              )}
                              {voice.localService && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  Local
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {showDefaultOption && onSetDefaultVoice && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onSetDefaultVoice(voice)) {
                                    showToast(`"${voice.name}" set as default voice`, 'success')
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Set as default voice"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                testVoice(voice)
                              }}
                              disabled={isTesting}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Test voice"
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Tips:</strong>
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Click on a voice to select it</li>
                <li>Use the test button to preview how a voice sounds</li>
                <li>If a voice is unavailable, try refreshing or selecting another voice</li>
                <li>Your selection will be saved automatically</li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

