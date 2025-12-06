import { useEffect, useState } from 'react'
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi2'
import inventoryService, { InventoryItem } from '@/services/inventoryService'

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await inventoryService.getAll()
      setInventory(data)
    } catch (err: any) {
      console.error('Error loading inventory:', err)
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.current_stock / item.minimum_stock) * 100
    if (percentage < 30) return { label: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/20' }
    if (percentage < 100) return { label: 'Low', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' }
    return { label: 'Good', color: 'text-green-600 bg-green-100 dark:bg-green-900/20' }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your cleaning supplies inventory
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button onClick={loadInventory} className="mt-2 text-sm text-red-700 dark:text-red-300 underline">
            Retry
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {inventory.length}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
            {inventory.filter(item => item.current_stock < item.minimum_stock).length}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            SAR {inventory.reduce((sum, item) =>
              sum + (item.current_stock * (item.products?.unit_cost || 0)), 0
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        {inventory.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No inventory items yet</p>
            <button className="btn btn-primary">
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {inventory.map((item) => {
                  const status = getStockStatus(item)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.products?.name || 'Unknown Product'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.products?.sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.current_stock} {item.products?.unit_of_measure}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.minimum_stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-3">
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory