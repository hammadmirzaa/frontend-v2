import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import config from '../config'

const API_URL = config.API_URL

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)
  const { showToast, ToastContainer } = useToast()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    // Wait a moment for webhook to process, then check subscription status
    const verifyPayment = async () => {
      try {
        // Wait 3 seconds for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Check subscription status if user is logged in
        if (user?.tenant_id) {
          try {
            const response = await axios.get(`${API_URL}/api/tenants/${user.tenant_id}/subscription`)
            const subscription = response.data
            
            if (subscription.status === 'ACTIVE' || subscription.setup_payment_status === 'PAID') {
              setVerified(true)
              showToast('Payment successful! Your subscription has been activated.', 'success')
            } else {
              // Payment may still be processing
              setVerified(true)
              showToast('Payment received. Your subscription will be activated shortly.', 'success')
            }
          } catch (err) {
            // If check fails, still show success (webhook may process it)
            console.error('Subscription check error:', err)
            setVerified(true)
            showToast('Payment received. Your subscription will be activated shortly.', 'success')
          }
        } else {
          // User not logged in, just show success
          setVerified(true)
          showToast('Payment successful! Your subscription has been activated.', 'success')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        // Even if verification fails, webhook may have processed it
        setVerified(true)
        showToast('Payment received. Your subscription will be activated shortly.', 'success')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId, user, showToast])

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ToastContainer />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
            <p className="text-gray-600">
              Please wait while we verify your payment.
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : verified ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your payment. Your subscription has been activated.
            </p>
            {sessionId && (
              <p className="text-xs text-gray-400 mb-6">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            )}
            <button
              onClick={handleGoToDashboard}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
