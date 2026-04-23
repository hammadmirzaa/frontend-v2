import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import config from '../config'

const AuthContext = createContext()

const API_URL = config.API_URL
const AUTH_ERROR_STORAGE_KEY = 'auth_error_message'

const getAuthErrorMessage = (error) => {
  const detail = error?.response?.data?.detail
  const normalizedDetail = typeof detail === 'string'
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`)
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      const authErrorMessage = getAuthErrorMessage(error)
      if (authErrorMessage) {
        localStorage.setItem(AUTH_ERROR_STORAGE_KEY, authErrorMessage)
      }
      if (error.response?.status === 401 || authErrorMessage) {
        logout()
        window.location.href = '/login'
      } else {
        logout()
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await axios.post(`${API_URL}/api/auth/login`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const { access_token } = response.data
    setToken(access_token)
    localStorage.setItem('token', access_token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    const userData = await fetchUser()
    return { ...response.data, user: userData }
  }

  const signup = async (email, password, fullName) => {
    const response = await axios.post(`${API_URL}/api/auth/signup`, {
      email,
      password,
      full_name: fullName
    })
    return response.data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

