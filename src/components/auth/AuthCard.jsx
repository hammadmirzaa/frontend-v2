export default function AuthCard({ children, className = '' }) {
  return (
    <div
      className={`w-full max-w-md rounded-auth bg-white px-6 py-4 md:px-8 md:py-6 ${className}`}
    >
      {children}
    </div>
  )
}
