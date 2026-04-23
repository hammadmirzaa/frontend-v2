import { Bot, MessageCircle, Copy, Check } from 'lucide-react'

export default function PreviewStep({
  widgetTitle,
  initialMessage,
  embedCode,
  copied,
  onCopy,
}) {
  return (
    <div className="mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Widget preview</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
            <span className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <div className="ml-2 flex-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">https://yourwebsite.com</div>
          </div>
          <div className="relative min-h-[260px] bg-white p-4">
            <div className=" max-w-md space-y-2 opacity-40">
              <div className="h-3 w-[75%] rounded bg-gray-300" />
              <div className="h-3 w-full rounded bg-gray-300" />
              <div className="h-3 w-[83%] rounded bg-gray-300" />
            </div>
            <div className="absolute bottom-16 right-6 w-[285px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center gap-2 bg-brand-teal px-3 py-2 text-white">
                <Bot className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{widgetTitle || 'Chat Assistant'}</p>
                  <p className="text-[10px] text-white/90">Online</p>
                </div>
              </div>
              <div className="p-3">
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  {initialMessage || 'Hi! How can I help you today?'}
                </div>
              </div>
            </div>
                          <div className="absolute bottom-2 right-4 flex justify-end p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal text-white shadow-md">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Embed code</h2>
        <div className="relative mt-3">
          <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-4 pr-12 text-xs text-gray-800">{embedCode || 'Loading…'}</pre>
          <button
            type="button"
            onClick={onCopy}
            disabled={!embedCode}
            className="absolute right-2 top-2 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-40"
            aria-label="Copy embed code"
          >
            {copied ? <Check className="h-4 w-4 text-brand-teal" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Use this embed code to integrate the chatbot into your website and start engaging visitors instantly.
        </p>
      </div>
    </div>
  )
}
