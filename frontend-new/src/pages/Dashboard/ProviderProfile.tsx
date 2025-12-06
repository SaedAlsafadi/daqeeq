import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { HiCheckCircle, HiExclamationTriangle, HiStar } from 'react-icons/hi2'
import serviceProviderService, { ServiceProvider } from '@/services/serviceProviderService'

const ProviderProfile = () => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<ServiceProvider>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceProviderService.getProfile()
      setProvider(data)
      setFormData(data)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : null) : value
    }))
  }

  const handleArrayInputChange = (name: string, value: string) => {
    const arrayValue = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    setFormData((prev) => ({
      ...prev,
      [name]: arrayValue.length > 0 ? arrayValue : undefined
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await serviceProviderService.updateProfile(formData)
      setProvider(formData as ServiceProvider)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(provider || {})
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">Error</h3>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={loadProfile}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Retry
        </button>
      </div>
    )
  }

  const specializations = [
    'Hotels',
    'Hospitals',
    'Schools',
    'Restaurants',
    'Retail Stores',
    'Shopping Malls',
    'Airports',
    'Banks',
    'Gyms',
    'Libraries',
    'Storage Facilities',
    'Warehouses',
    'college',
    'company'
  ]

  const serviceTypes = [
    'Daily Cleaning',
    'Deep Cleaning',
    'Carpet Cleaning',
    'Window Cleaning',
    'Janitorial Services',
    'Disinfection',
    'Equipment Rental',
    'Supply Provision'
  ]

  const capacityLevels = [
    { value: 'small', label: 'Small (1-5 employees)' },
    { value: 'medium', label: 'Medium (6-20 employees)' },
    { value: 'large', label: 'Large (21-50 employees)' },
    { value: 'enterprise', label: 'Enterprise (50+ employees)' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your complete company information and services
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-medium"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-300 mb-2">
              Account Status
            </h2>
            <p className="text-primary-700 dark:text-primary-400 text-sm">
              Active: {provider?.status ? 'Yes' : 'No'} | Verified: {provider?.is_verified ? 'Yes' : 'No'}
            </p>
          </div>
          <HiCheckCircle className="text-primary-600 w-6 h-6" />
        </div>
      </div>

      {/* Basic Company Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-60"
            />
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Person Name
            </label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="https://example.com"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Years in Business */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Years in Business
            </label>
            <input
              type="number"
              name="years_in_business"
              value={formData.years_in_business || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              min="0"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Address Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Specializations & Services */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Specializations</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Industries You Specialize In (comma-separated or select from below)
          </label>
          <textarea
            value={(formData.specialization || []).join(', ')}
            onChange={(e) => handleArrayInputChange('specialization', e.target.value)}
            disabled={!isEditing}
            rows={3}
            placeholder="e.g., Hotels, Hospitals, Schools"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 mb-4"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specializations.map((spec) => (
              <label
                key={spec}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${isEditing
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={(formData.specialization || []).includes(spec)}
                  onChange={(e) => {
                    const specs = formData.specialization || []
                    if (e.target.checked) {
                      setFormData((prev) => ({
                        ...prev,
                        specialization: [...specs, spec]
                      }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        specialization: specs.filter((s) => s !== spec)
                      }))
                    }
                  }}
                  disabled={!isEditing}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{spec}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Service Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Service Types Provided (comma-separated or select from below)
          </label>
          <textarea
            value={(formData.service_types || []).join(', ')}
            onChange={(e) => handleArrayInputChange('service_types', e.target.value)}
            disabled={!isEditing}
            rows={3}
            placeholder="e.g., Daily Cleaning, Deep Cleaning"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 mb-4"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {serviceTypes.map((service) => (
              <label
                key={service}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${isEditing
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={(formData.service_types || []).includes(service)}
                  onChange={(e) => {
                    const services = formData.service_types || []
                    if (e.target.checked) {
                      setFormData((prev) => ({
                        ...prev,
                        service_types: [...services, service]
                      }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        service_types: services.filter((s) => s !== service)
                      }))
                    }
                  }}
                  disabled={!isEditing}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{service}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity & Regions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Capacity & Service Areas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Capacity Level
            </label>
            <select
              name="capacity_level"
              value={formData.capacity_level || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            >
              <option value="">Select capacity level</option>
              {capacityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service Regions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Regions (comma-separated)
            </label>
            <input
              type="text"
              value={(formData.service_regions || []).join(', ')}
              onChange={(e) => handleArrayInputChange('service_regions', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., North Region, South Region"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Terms */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Pricing & Business Terms</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Minimum Order Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Order Value (SAR)
            </label>
            <input
              type="number"
              name="minimum_order_value"
              value={formData.minimum_order_value || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Delivery Time (days)
            </label>
            <input
              type="number"
              name="delivery_time_days"
              value={formData.delivery_time_days || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              min="0"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Payment Terms */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Terms
            </label>
            <textarea
              name="payment_terms"
              value={formData.payment_terms || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              placeholder="e.g., Net 30, Credit Card, Bank Transfer"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Rating Section */}
      {provider && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <HiStar className="mr-2 text-yellow-600" />
            Your Rating
          </h2>
          <div className="flex items-center">
            <div className="text-4xl font-bold text-yellow-600 mr-4">
              {provider.rating?.toFixed(1) || '0'}
            </div>
            <div>
              <div className="flex items-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <HiStar
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(provider.rating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                      }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {provider.total_reviews} reviews
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ProviderProfile