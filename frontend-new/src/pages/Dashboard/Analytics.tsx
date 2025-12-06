import { useState, useEffect } from 'react'
import {
  HiChartBar,
  HiCurrencyDollar,
  HiShoppingCart,
  HiChartPie
} from 'react-icons/hi2'
import analyticsService, {
  DashboardAnalytics,
  CategoryTrend,
  SpendingAnalytics
} from '@/services/analyticsService'

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null)
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([])
  const [spendingData, setSpendingData] = useState<SpendingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboard, trends, spending] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getInventoryTrends(),
        analyticsService.getSpending(30)
      ])

      setDashboardData(dashboard)
      setCategoryTrends(trends)
      setSpendingData(spending)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Insights and trends for your business
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button onClick={loadAnalytics} className="mt-2 text-sm text-red-700 dark:text-red-300 underline">
            Retry
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
              <HiShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
              <HiCurrencyDollar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                SAR {dashboardData?.totalSpent || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
              <HiChartBar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Predictions Made</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData?.predictions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory by Category */}
      <div className="card p-6">
        <div className="flex items-center mb-6">
          <HiChartPie className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Inventory by Category
          </h2>
        </div>

        {categoryTrends.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No inventory data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryTrends.map((trend, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {trend.category}
                  </h3>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    SAR {trend.totalValue.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Items:</span> {trend.totalItems}
                  </div>
                  <div>
                    <span className="font-medium">Low Stock:</span>{' '}
                    <span className={trend.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                      {trend.lowStockCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Analytics */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiCurrencyDollar className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Spending Analytics (Last {spendingData?.period || 30} Days)
            </h2>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            SAR {spendingData?.totalSpending || '0.00'}
          </div>
        </div>

        {/* Spending by Supplier */}
        {spendingData && Object.keys(spendingData.supplierSpending).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Spending by Supplier
            </h3>
            <div className="space-y-3">
              {Object.entries(spendingData.supplierSpending)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([supplier, amount]) => {
                  const percentage = (amount / parseFloat(spendingData.totalSpending)) * 100
                  return (
                    <div key={supplier}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {supplier}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          SAR {amount.toFixed(2)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Daily Spending Trend */}
        {spendingData && Object.keys(spendingData.dailySpending).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recent Daily Spending
            </h3>
            <div className="space-y-2">
              {Object.entries(spendingData.dailySpending)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .slice(0, 7)
                .map(([date, amount]) => (
                  <div key={date} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(date).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      SAR {amount.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {(!spendingData || (
          Object.keys(spendingData.supplierSpending).length === 0 &&
          Object.keys(spendingData.dailySpending).length === 0
        )) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No spending data available for the selected period</p>
            </div>
          )}
      </div>
    </div>
  )
}

export default Analytics