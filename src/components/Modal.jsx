import { X } from 'lucide-react'
import { cn } from '../utils/cn'

const Modal = ({ isOpen, onClose, title, subtitle, children, showCloseButton = true, panelClassName }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      
      <div
        className={cn(
          'relative mx-4 flex min-h-0 w-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-white shadow-xl transition-all',
          'max-h-[min(92vh,560px)]',
          panelClassName
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Body — flex-1 + min-h-0 lets children use overflow-y-auto for scroll inside the panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal

