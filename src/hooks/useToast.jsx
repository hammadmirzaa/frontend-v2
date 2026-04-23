import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

/** Above nav profile (z-60), Modal (z-50), and heavy modals (z-100–140); portal avoids parent stacking contexts */
const TOAST_Z = 'z-[200]'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now()
    const toast = { id, message, type, duration }
    setToasts((prev) => [...prev, toast])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = () => {
    if (typeof document === 'undefined') return null

    return createPortal(
      <div
        className={`pointer-events-none fixed top-24 right-4 flex max-w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6 ${TOAST_Z}`}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle size={20} className="text-green-500" />,
            error: <XCircle size={20} className="text-red-500" />,
            warning: <AlertCircle size={20} className="text-yellow-500" />,
            info: <AlertCircle size={20} className="text-blue-500" />
          }

          const bgColors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-[1px] transition-all duration-300 animate-slide-in ${bgColors[toast.type]}`}
            >
              {icons[toast.type]}
              <p className="min-w-0 flex-1 font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 hover:opacity-70"
              >
                <X size={18} />
              </button>
            </div>
          )
        })}
      </div>,
      document.body
    )
  }

  return { showToast, removeToast, ToastContainer }
}

