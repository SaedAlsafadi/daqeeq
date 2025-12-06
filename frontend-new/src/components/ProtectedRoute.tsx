import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to signin page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // Check if user needs to change password on first login
  if (user?.forcePasswordChange) {
    return <Navigate to="/change-password" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute