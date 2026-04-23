import AuthPageFooter from './AuthPageFooter'

export default function AuthPageLayout({ variant = 'login', children }) {
  const bgClass = variant === 'signup' ? 'auth-page-bg-signup' : 'auth-page-bg-login'

  return (
    <div className={`min-h-screen flex flex-col font-sans ${bgClass}`}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-12">
        {children}
      </div>
      <AuthPageFooter />
    </div>
  )
}
