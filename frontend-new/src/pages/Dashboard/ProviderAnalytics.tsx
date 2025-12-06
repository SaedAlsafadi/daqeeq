import { useEffect, useState } from 'react'
import { HiStar, HiDocumentText, HiCurrencyDollar, HiUsers } from 'react-icons/hi2'
import serviceProviderService, { Analytics } from '@/services/serviceProviderService'

const ProviderAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceProviderService.getAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      console.error('Error loading analytics:', err)
      setError(err.message || 'Failed to load analytics')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Performance metrics and insights
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {analytics && (
        <>
          {/* Monthly Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monthly Revenue</h2>
            <div className="flex items-end gap-2 h-64 pb-4">
              {analytics.monthlyRevenue.map((item, index) => {
                const maxValue = Math.max(...analytics.monthlyRevenue.map((r) => r.value))
                const percentage = (item.value / maxValue) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary-200 dark:bg-primary-900/30 rounded-t-lg overflow-hidden">
                      <div
                        className="bg-gradient-to-t from-primary-600 to-primary-500 w-full transition-all duration-300 hover:from-primary-700 hover:to-primary-600"
                        style={{ height: `${percentage}%`, minHeight: percentage > 0 ? '4px' : '0px' }}
                        title={`SAR ${item.value}`}
                      ></div>
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.month}</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">${(item.value / 1000).toFixed(1)}k</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Request Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests by Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Requests by Status</h2>
              <div className="space-y-4">
                {Object.entries(analytics.requestsByStatus).map(([status, count]) => {
                  const total = Object.values(analytics.requestsByStatus).reduce((a, b) => a + b, 0)
                  const percentage = ((count as number) / total) * 100
                  const colors: Record<string, string> = {
                    pending: 'bg-yellow-500',
                    accepted: 'bg-blue-500',
                    completed: 'bg-green-500',
                    rejected: 'bg-red-500'
                  }

                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {status}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {count} ({Math.round(percentage)}%)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${colors[status] || 'bg-gray-500'} rounded-full h-2 transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Rating Distribution</h2>
              <div className="space-y-4">
                {analytics.ratingDistribution.map((item) => {
                  const total = analytics.ratingDistribution.reduce((a, b) => a + b.count, 0)
                  const percentage = (item.count / total) * 100

                  return (
                    <div key={item.stars}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <HiStar
                              key={i}
                              className={`w-4 h-4 ${i < item.stars ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.count}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Service Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Requests
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Avg. Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.serviceBreakdown.map((service, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {service.service}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                          {service.count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        SAR {service.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        SAR {Math.round(service.revenue / service.count).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <HiDocumentText className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Total Requests</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                      {analytics.serviceBreakdown.reduce((a, s) => a + s.count, 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <HiCurrencyDollar className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Total Revenue</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-300">
                      SAR {analytics.serviceBreakdown.reduce((a, s) => a + s.revenue, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <HiUsers className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Avg Request Value</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                      SAR {Math.round(analytics.serviceBreakdown.reduce((a, s) => a + s.revenue, 0) / analytics.serviceBreakdown.reduce((a, s) => a + s.count, 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ProviderAnalytics