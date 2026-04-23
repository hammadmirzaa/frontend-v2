export default function GoogleSignInButton({ disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Continue with Google (sign-in not yet configured)"
    >
      <img src="/svgs/login/google-logo.svg" alt="Google" className="w-5 h-5" />
      Continue with Google
    </button>
  )
}
