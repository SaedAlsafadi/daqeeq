import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HiDocumentText, 
  HiCurrencyDollar, 
  HiChartBarSquare,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiSparkles,
  HiCubeTransparent
} from 'react-icons/hi2'
import dashboardService, { DashboardStats } from '@/services/dashboardService'
import quotationService, { QuotationRequest } from '@/services/quotationService'
import feedbackService from '@/services/feedbackService'

interface FeedbackSummary {
  total_feedback: number
  accuracy_rate: number
  underestimated_count: number
  overestimated_count: number
}

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRequests, setRecentRequests] = useState<QuotationRequest[]>([])
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all dashboard data in parallel
      const [statsData, requestsData, feedbackData] = await Promise.all([
        dashboardService.getStats(),
        quotationService.getQuotationRequests().catch(() => ({ requests: [] })),
        feedbackService.getSummary().catch(() => ({
          total_feedback: 0,
          accuracy_rate: 0,
          underestimated_count: 0,
          overestimated_count: 0,
          most_accurate_items: [],
          needs_improvement_items: []
        }))
      ])

      setStats(statsData)
      setRecentRequests(requestsData.requests.slice(0, 5)) // Get only the 5 most recent
      setFeedbackSummary(feedbackData)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
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
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statsConfig = [
    {
      name: 'Total Inventory Value',
      value: `$${stats?.totalInventoryValue || '0.00'}`,
      change: '+12%',
      changeType: 'increase',
      icon: HiCubeTransparent,
    },
    {
      name: 'Active Requests',
      value: stats?.activeOrders.toString() || '0',
      change: '+3',
      changeType: 'increase',
      icon: HiDocumentText,
    },
    {
      name: 'Monthly Savings',
      value: `$${stats?.monthlySavings || '0.00'}`,
      change: '+8%',
      changeType: 'increase',
      icon: HiCurrencyDollar,
    },
    {
      name: 'Forecast Accuracy',
      value: `${stats?.forecastAccuracy || '0.0'}%`,
      change: '+0.5%',
      changeType: 'increase',
      icon: HiChartBarSquare,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.companyName || `${user?.firstName} ${user?.lastName}`}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your cleaning supplies today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.changeType === 'increase' ? (
                <HiArrowTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <HiArrowTrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Quotation Requests
          </h2>
          <button 
            onClick={() => window.location.href = '/dashboard/requests'}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            View all
          </button>
        </div>
        <div className="space-y-4">
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No recent requests</p>
              <button 
                onClick={() => window.location.href = '/dashboard/prediction'}
                className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Generate prediction to send requests
              </button>
            </div>
          ) : (
            recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.request_number}
                    </p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'accepted' || request.status === 'quoted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : request.status === 'viewed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : request.status === 'cancelled' || request.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {request.service_providers?.company_name || 'Provider'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {request.quotation_request_items?.length || 0} item(s)
                  </p>
                </div>
                <div className="text-right ml-4">
                  {request.quoted_amount ? (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${request.quoted_amount.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Awaiting quote
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(request.requested_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Supply Feedback Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <HiCubeTransparent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Supply Feedback System
            </h2>
          </div>
          <a
            href="/dashboard/feedback"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View Details →
          </a>
        </div>
        
        {feedbackSummary && feedbackSummary.total_feedback > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Feedback Submitted</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {feedbackSummary.total_feedback}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accuracy Rate</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {feedbackSummary.accuracy_rate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Underestimated</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {feedbackSummary.underestimated_count}
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overestimated</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {feedbackSummary.overestimated_count}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-3">No feedback submitted yet</p>
            <p className="text-sm mb-4">Submit predictions and log feedback to improve accuracy</p>
            <a
              href="/dashboard/feedback"
              className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
            >
              Go to Supply Feedback
            </a>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          AI Insights & Recommendations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Demand Forecast
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Based on your usage patterns, demand predictions are available in the Predictions tab.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
              Cost Optimization
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              {stats && stats.lowStockCount > 0 
                ? `${stats.lowStockCount} items need restocking. Consider bulk orders for better pricing.`
                : 'Your inventory levels are optimal. No immediate action needed.'
              }
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
              Forecast Accuracy
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Your prediction accuracy is {stats?.forecastAccuracy || '0.0'}%. 
              {parseFloat(stats?.forecastAccuracy || '0') > 90 
                ? ' Excellent performance!' 
                : ' More data will improve predictions.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard