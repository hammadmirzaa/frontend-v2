import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  AuthPageLayout,
  AuthBrandLogo,
  AuthCard,
  GoogleSignInButton,
  AuthTextField,
  AuthPasswordField,
  AuthPrimaryButton,
} from '../components/auth'
import Checkbox from '../components/form/Checkbox'

const AUTH_ERROR_STORAGE_KEY = 'auth_error_message'

const getLoginErrorMessage = (err) => {
  const detail = err?.response?.data?.detail
  const normalizedDetail =
    typeof detail === 'string'
      ? detail.toLowerCase()
      : (detail?.code || detail?.message || '').toString().toLowerCase()

  if (normalizedDetail.includes('tenant_inactive')) {
    return 'Your tenant is inactive. Please contact your Super Admin.'
  }
  if (normalizedDetail.includes('user_inactive')) {
    return 'Your account is inactive. Please contact your tenant admin.'
  }
  return null
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const storedError = localStorage.getItem(AUTH_ERROR_STORAGE_KEY)
    if (storedError) {
      setError(storedError)
      localStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      const u = result?.user
      if (u?.role === 'SUPER_USER' || u?.is_super_user) {
        navigate('/dashboard?tab=dashboards')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const authErrorMessage = getLoginErrorMessage(err)
      if (authErrorMessage) {
        setError(authErrorMessage)
      } else {
        setError(err.response?.data?.detail || 'Failed to login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout variant="login">
      <AuthBrandLogo />
      <AuthCard>
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-600">
          Enter your details to access your workspace.
          </p>
        </div>

        {/* <GoogleSignInButton /> */}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="animate-slide-in rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <AuthTextField
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <AuthPasswordField
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((v) => !v)}
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs mb-2 text-gray-600">
            <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>

          <AuthPrimaryButton loading={loading} loadingLabel="Signing in...">
            Sign in
          </AuthPrimaryButton>

          {/* <p className="text-center text-xs text-gray-600">
            Don&apos;t remember your password?{' '}
            <a
              href="#"
              className="underline text-black underline-offset-2 hover:text-gray-800"
              onClick={(e) => e.preventDefault()}
            >
              Reset here
            </a>
          </p> */}
        </form>
      </AuthCard>
    </AuthPageLayout>
  )
}
