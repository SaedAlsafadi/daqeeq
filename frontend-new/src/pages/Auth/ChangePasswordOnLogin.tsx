import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

const ChangePasswordOnLogin: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshUser, clearForcePasswordChange } = useAuth()
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not logged in or doesn't need password change
  React.useEffect(() => {
    if (!user) {
      navigate('/signin')
    } else if (!user.forcePasswordChange) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Password changed successfully!')
        
        // Clear the forcePasswordChange flag from the auth context
        clearForcePasswordChange()
        
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          // Route based on user role
          if (user?.role) {
            switch (user.role) {
              case 'admin':
                navigate('/dashboard/suppliers', { replace: true })
                break
              case 'service_provider':
                navigate('/dashboard/provider', { replace: true })
                break
              case 'supplier':
                navigate('/dashboard/provider', { replace: true })
                break
              case 'client':
              default:
                navigate('/dashboard', { replace: true })
                break
            }
          } else {
            navigate('/dashboard', { replace: true })
          }
        }, 100)
      } else {
        toast.error(data.message || 'Failed to change password')
        setErrors({ submit: data.message || 'Failed to change password' })
      }
    } catch (error) {
      console.error('Change password error:', error)
      toast.error('An error occurred. Please try again.')
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Lock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This is your first login. Please set a secure password to continue.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Temporary Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter the temporary password provided"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition bg-white dark:bg-gray-700 dark:text-white ${
                  errors.currentPassword
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 ${
                  errors.currentPassword
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition bg-white dark:bg-gray-700 dark:text-white ${
                  errors.newPassword
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 ${
                  errors.newPassword
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition bg-white dark:bg-gray-700 dark:text-white ${
                  errors.confirmPassword
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* General Error */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg font-semibold transition bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-600 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating Password...' : 'Continue to Dashboard'}
          </button>
        </form>

        {/* Password Requirements */}
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
          <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Password Requirements:
          </p>
          <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Minimum 6 characters</li>
            <li>• Must be different from temporary password</li>
            <li>• Passwords must match</li>
          </ul>
        </div>

        {/* User Info */}
        <div className="p-3 rounded-lg border bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Logged in as:</span> {user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordOnLogin