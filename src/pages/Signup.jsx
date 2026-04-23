import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import config from '../config'
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

const API_URL = config.API_URL

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!agreedToTerms) {
      setError('You must agree to the terms and privacy to continue.')
      return
    }

    setLoading(true)

    try {
      await axios.post(`${API_URL}/api/auth/signup`, {
        email,
        password,
        full_name: fullName,
      })
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout variant="signup">
      <AuthBrandLogo />
      <AuthCard>
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create new account</h1>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-normal text-gray-600 underline underline-offset-2 hover:text-gray-800"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <GoogleSignInButton />

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="animate-slide-in rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <AuthTextField
            id="fullName"
            name="fullName"
            label="Name"
            autoComplete="name"
            required
            placeholder="Enter your Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

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
            autoComplete="new-password"
            required
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((v) => !v)}
          />

          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
            <Checkbox
              className="mt-0.5"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-gray-800"
                onClick={(e) => e.preventDefault()}
              >
                terms and privacy
              </a>
            </span>
          </label>

          <AuthPrimaryButton loading={loading} loadingLabel="Creating account...">
            Create Account
          </AuthPrimaryButton>
        </form>
      </AuthCard>
    </AuthPageLayout>
  )
}
