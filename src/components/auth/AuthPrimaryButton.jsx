export default function AuthPrimaryButton({
  children,
  loading = false,
  loadingLabel,
  disabled = false,
  type = 'submit',
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center rounded-lg bg-brand-teal py-2.5 text-sm font-normal text-white shadow-sm transition-colors hover:bg-brand-teal-hover focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
