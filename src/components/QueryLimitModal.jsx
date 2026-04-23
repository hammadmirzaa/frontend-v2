import Modal from './Modal'
import { useNavigate } from 'react-router-dom'

export default function QueryLimitModal({ isOpen, onClose, rolePopupType = 'contact_admin' }) {
  const navigate = useNavigate()
  const isAdminUpgrade = rolePopupType === 'admin_upgrade'

  const handleUpgrade = () => {
    // Navigate to subscription tab; Dashboard will pick up the query param
    navigate('/dashboard?tab=subscription')
    onClose?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Usage limit reached">
      {isAdminUpgrade ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Your tenant has reached its included query limit. Upgrade your plan or purchase additional
            queries to continue.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 gradient-bg text-white rounded-md hover:opacity-90"
            >
              Upgrade or Buy More
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Your tenant’s query limit has been reached.
          </p>
          <p className="text-sm text-gray-700">
            Please contact your admin to upgrade the plan or purchase additional queries.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
