import { useState, useEffect } from 'react'
import { Upload, Trash2, FileText, Globe, Plus } from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import config from '../config'
import Modal from './Modal'
import Spinner from './Spinner'

const API_URL = config.API_URL

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [limitMessage, setLimitMessage] = useState('Document limit reached. Please upgrade your plan or purchase additional units.')
  const [deleting, setDeleting] = useState(null) // Track which document is being deleted
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const { showToast, ToastContainer } = useToast()
  const [libraries, setLibraries] = useState([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);
  const [updatingDocument, setUpdatingDocument] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [selectedLibraryForUrl, setSelectedLibraryForUrl] = useState('');

  useEffect(() => {
    fetchDocuments()
    fetchLibraries()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/documents/`)
      setDocuments(response.data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

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


  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchDocuments()
      const count = response.data.length
      showToast(`${count} document${count > 1 ? 's' : ''} uploaded and ${count > 1 ? 'are' : 'is'} being processed!`, 'success')
    } catch (error) {
      const code = error?.response?.data?.error_code || error?.response?.data?.detail?.error_code
      const msg = error?.response?.data?.message || error?.response?.data?.detail?.message
      if (code === 'DOCUMENT_LIMIT_REACHED') {
        setLimitMessage(msg || 'Document limit reached. Please upgrade your plan or purchase additional units.')
        setLimitModalOpen(true)
      } else {
        showToast('Failed to upload document(s): ' + (error.response?.data?.detail || error.message), 'error')
      }
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleIngestUrl = async () => {
    if (!urlInput.trim()) {
      showToast('Please enter a valid URL', 'error')
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput.trim())
    } catch {
      showToast('Please enter a valid URL (must include http:// or https://)', 'error')
      return
    }

    setIngestingUrl(true)
    try {
      const response = await axios.post(`${API_URL}/api/documents/ingest-url`, {
        url: urlInput.trim(),
        library_id: selectedLibraryForUrl || null
      })
      fetchDocuments()
      showToast('Website URL ingested successfully! Content is being extracted and processed.', 'success')
      setUrlInput('')
      setSelectedLibraryForUrl('')
    } catch (error) {
      showToast('Failed to ingest URL: ' + (error.response?.data?.detail || error.message), 'error')
    } finally {
      setIngestingUrl(false)
    }
  }

  const handleDeleteClick = (documentId, filename) => {
    setDocumentToDelete({ id: documentId, filename })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setDeleting(documentToDelete.id)
    try {
      await axios.delete(`${API_URL}/api/documents/${documentToDelete.id}`)
      fetchDocuments()
      showToast('Document deleted successfully', 'success')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      showToast('Failed to delete document', 'error')
    } finally {
      setDeleting(null)
    }
  }
  const getCurrentLibraryName = (libraryId) => {
    if (!libraryId) return 'Public';
    const library = libraries.find(lib => lib.id === libraryId);
    return library ? library.name : 'Public';
  };

  const handleLibraryChange = async (documentId, libraryId) => {
    if (!libraryId) return;

    setUpdatingDocument(documentId);
    try {
      await axios.patch(`${API_URL}/api/documents/${documentId}/library/${libraryId}`);
      fetchDocuments();
      showToast('Document library updated successfully', 'success');

    } catch (error) {
      console.error('Failed to update document:', error);
      showToast('Failed to update document library', 'error');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const kb = parseInt(bytes) / 1024
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <>
      <ToastContainer />
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
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setDeleteModalOpen(false)
                setDocumentToDelete(null)
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={deleting === documentToDelete?.id}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting === documentToDelete?.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {deleting === documentToDelete?.id && <Spinner size="sm" className="text-white" />}
              <span>{deleting === documentToDelete?.id ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Document Limit Modal */}
      <Modal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        title="Document limit reached"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{limitMessage}</p>
          <div className="flex justify-end">
            <a
              href="/dashboard?tab=subscription"
              className="px-4 py-2 gradient-bg text-white rounded-md hover:opacity-90"
              onClick={() => setLimitModalOpen(false)}
            >
              Upgrade or Buy More
            </a>
          </div>
        </div>
      </Modal>
      <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your knowledge base documents</p>
        </div>

        <div className="p-6 border-b space-y-4">
          {/* File Upload Section */}
          <div>
            <label className={`inline-flex items-center px-4 py-3 gradient-bg text-white rounded-lg cursor-pointer hover:opacity-90 ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}>
              {uploading && <Spinner size="sm" className="mr-2 text-white" />}
              <Upload size={20} className="mr-2" />
              <span>{uploading ? 'Uploading...' : 'Upload Documents'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.tsv,.xls,.xlsx,.json"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX, TXT, CSV, TSV, XLS, XLSX, JSON (multiple files allowed)</p>
          </div>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* URL Ingestion Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Globe size={20} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Add Website URL</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={ingestingUrl}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !ingestingUrl) {
                    handleIngestUrl()
                  }
                }}
              />
              <select
                value={selectedLibraryForUrl}
                onChange={(e) => setSelectedLibraryForUrl(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={ingestingUrl || loadingLibraries}
              >
                <option value="">Public Library</option>
                {libraries.map(lib => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleIngestUrl}
                disabled={ingestingUrl || !urlInput.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  ingestingUrl || !urlInput.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {ingestingUrl ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Add URL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Extract content from any website URL. The content will be processed using AI-powered extraction.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      doc.source_type === 'url' ? 'bg-blue-500' : 'gradient-bg'
                    }`}>
                      {doc.source_type === 'url' ? (
                        <Globe size={20} className="text-white" />
                      ) : (
                        <FileText size={20} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                        {doc.source_type === 'url' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            URL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 flex-wrap">
                        {doc.source_url && (
                          <a
                            href={doc.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                            title={doc.source_url}
                          >
                            {doc.source_url}
                          </a>
                        )}
                        {doc.file_size && (
                          <p className="text-sm text-gray-500">{formatFileSize(doc.file_size)}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${doc.processed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {doc.processed ? 'Processed' : 'Processing...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <select
                    onChange={(e) => handleLibraryChange(doc.id, e.target.value)}
                    disabled={updatingDocument === doc.id || loadingLibraries}
                    className="ml-4 p-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    value={doc.library_id || ''}
                  >
                    <option value="" disabled>{getCurrentLibraryName(doc.library_id)}</option>
                    <option value="public">Public</option>
                    {libraries.map(lib => (
                      <option key={lib.id} value={lib.id}>
                        {lib.name}
                      </option>
                    ))}
                  </select>


                  <button
                    onClick={() => handleDeleteClick(doc.id, doc.filename)}
                    disabled={deleting === doc.id}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {deleting === doc.id ? (
                      <Spinner size="sm" className="text-red-600" />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

