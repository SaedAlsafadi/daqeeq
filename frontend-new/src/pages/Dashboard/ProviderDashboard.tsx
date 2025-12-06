import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  HiDocumentText,
  HiCheckCircle,
  HiCurrencyDollar,
  HiStar,
  HiArrowTrendingUp,
  HiUsers,
  HiClock
} from 'react-icons/hi2'
import serviceProviderService, { DashboardStats, ProviderRequest } from '@/services/serviceProviderService'

const ProviderDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRequests, setRecentRequests] = useState<ProviderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, requestsData] = await Promise.all([
        serviceProviderService.getDashboardStats(),
        serviceProviderService.getRequests(undefined, 1, 5).catch(() => ({ requests: [] }))
      ])

      setStats(statsData)
      setRecentRequests(requestsData.requests || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
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
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statsConfig = [
    {
      name: 'Active Requests',
      value: stats?.activeRequests || '0',
      change: '+12%',
      changeType: 'increase' as const,
      icon: HiDocumentText,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Completed Requests',
      value: stats?.completedRequests || '0',
      change: '+8%',
      changeType: 'increase' as const,
      icon: HiCheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    },
    {
      name: 'Total Revenue',
      value: `SAR ${stats?.totalRevenue || '0'}`,
      change: '+15%',
      changeType: 'increase' as const,
      icon: HiCurrencyDollar,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600'
    },
    {
      name: 'Average Rating',
      value: `${stats?.averageRating?.toFixed(1) || '0'}★`,
      change: `${stats?.totalReviews || 0} reviews`,
      changeType: 'info' as const,
      icon: HiStar,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your service provider dashboard overview
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`${stat.bgColor} border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'increase' && (
                      <>
                        <HiArrowTrendingUp className="text-green-600 mr-1" />
                        <span className="text-sm text-green-600">{stat.change}</span>
                      </>
                    )}
                    {stat.changeType === 'info' && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.change}</span>
                    )}
                  </div>
                </div>
                <Icon className={`${stat.iconColor} w-12 h-12 opacity-20`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Requests
          </h2>

          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <HiDocumentText className="mx-auto w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No recent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {request.clientName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {request.serviceType} • Qty: {request.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      SAR {request.totalValue.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mt-1 ${request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : request.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : request.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            View All Requests
          </button>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Response Rate
            </h3>
            <div className="relative h-20 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">
                  {stats?.responseRate || '0'}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Excellent performance
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Onboarding Progress</h3>
            <p className="text-primary-100 text-sm mb-4">
              Complete your profile to unlock all features
            </p>
            <div className="w-full bg-primary-400/30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${stats?.onboardingProgress || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-primary-100 mt-2">{stats?.onboardingProgress || 0}% Complete</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <HiClock className="mr-2 text-gray-600 dark:text-gray-400" />
              Pending Actions
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • {stats?.pendingRequests || 0} pending request(s)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • {stats?.acceptedRequests || 0} accepted request(s)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard