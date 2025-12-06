import { useEffect, useState } from 'react'
import { HiCheckCircle, HiClock, HiExclamationTriangle } from 'react-icons/hi2'
import serviceProviderService, { OnboardingStep } from '@/services/serviceProviderService'

const ProviderOnboarding = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [progress, setProgress] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  useEffect(() => {
    loadOnboardingStatus()
  }, [])

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceProviderService.getOnboardingStatus()
      setSteps(data.steps)
      setProgress(data.progress)
      setTotalSteps(data.totalSteps)
      setCompletedSteps(data.completedSteps)
    } catch (err: any) {
      console.error('Error loading onboarding status:', err)
      setError(err.message || 'Failed to load onboarding status')
    } finally {
      setLoading(false)
    }
  }

  const getStepDescription = (stepName: string): string => {
    const descriptions: Record<string, string> = {
      verification: 'Your company information will be verified by our team to ensure all details are accurate.',
      contract_signed: 'You will receive a partnership contract to review and sign.',
      credentials_sent: 'Login credentials and access to the dashboard will be provided.',
      account_activated: 'Your account will be fully activated and ready to receive client requests.',
      training_completed: 'Complete any required training materials and best practices.'
    }
    return descriptions[stepName] || 'Processing this step...'
  }

  const formatStepName = (name: string): string => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStepNumber = (index: number): number => {
    return index + 1
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: HiCheckCircle,
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          label: 'Completed'
        }
      case 'in_progress':
        return {
          icon: HiClock,
          color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
          label: 'In Progress'
        }
      case 'blocked':
        return {
          icon: HiExclamationTriangle,
          color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          label: 'Blocked'
        }
      default:
        return {
          icon: HiClock,
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          label: 'Pending'
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Onboarding Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your onboarding journey with us
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadOnboardingStatus}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Progress Overview Card */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-8 border border-primary-200 dark:border-primary-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-primary-700 dark:text-primary-400 font-semibold mb-2">Overall Progress</p>
            <p className="text-4xl font-bold text-primary-900 dark:text-primary-300">{progress}%</p>
          </div>
          <div>
            <p className="text-sm text-primary-700 dark:text-primary-400 font-semibold mb-2">Steps Completed</p>
            <p className="text-4xl font-bold text-primary-900 dark:text-primary-300">
              {completedSteps} / {totalSteps}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700 dark:text-primary-400 font-semibold mb-2">Estimated Timeline</p>
            <p className="text-4xl font-bold text-primary-900 dark:text-primary-300">3-5 Days</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="w-full bg-primary-300 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-full h-3 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Onboarding Steps</h2>

        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const statusInfo = getStatusInfo(step.status)
            const Icon = statusInfo.icon
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div
                    className="absolute left-6 top-16 w-1 h-12 bg-gray-300 dark:bg-gray-600"
                    style={{
                      background:
                        step.status === 'completed'
                          ? 'linear-gradient(to bottom, #10b981, #d1d5db)'
                          : '#d1d5db'
                    }}
                  ></div>
                )}

                {/* Step Card */}
                <div className="flex gap-6">
                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.color} border-2 border-current`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-grow min-w-0">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-1">
                            Step {getStepNumber(index)}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatStepName(step.stepName)}
                          </h3>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Expandable Description */}
                      {expandedStep === step.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                          <p className="text-gray-700 dark:text-gray-300">
                            {getStepDescription(step.stepName)}
                          </p>

                          {step.completedDate && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              ✓ Completed on {new Date(step.completedDate).toLocaleDateString()}
                            </p>
                          )}

                          {step.notes && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                Notes
                              </p>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{step.notes}</p>
                            </div>
                          )}

                          {step.status === 'blocked' && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-3">
                              <p className="text-sm text-red-700 dark:text-red-400">
                                ⚠️ This step is blocked. Please contact support for assistance.
                              </p>
                            </div>
                          )}

                          {step.status === 'in_progress' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
                              <p className="text-sm text-blue-700 dark:text-blue-400">
                                ℹ️ This step is currently in progress. We'll update you soon.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Support Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-700">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
          Need Help?
        </h3>
        <p className="text-indigo-700 dark:text-indigo-400 mb-4">
          If you have any questions about the onboarding process or encounter any issues, our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium">
            Contact Support
          </button>
          <button className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition font-medium">
            View FAQ
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', icon: HiClock },
          { label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: HiClock },
          { label: 'Completed', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', icon: HiCheckCircle },
          { label: 'Blocked', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', icon: HiExclamationTriangle }
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProviderOnboarding