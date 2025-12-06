import { apiRequest } from './api';

export interface DashboardStats {
  totalInventoryValue: string;
  activeOrders: number;
  monthlySavings: string;
  forecastAccuracy: string;
  lowStockCount: number;
}

export interface RecentOrder {
  id: string;
  supplier: string;
  items: string;
  amount: string;
  status: string;
  date: string;
}

export interface LowStockItem {
  name: string;
  current: number;
  minimum: number;
  status: 'critical' | 'low';
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest('/dashboard/stats');
    return response.stats;
  },

  // Get recent orders
  getRecentOrders: async (): Promise<RecentOrder[]> => {
    const response = await apiRequest('/dashboard/recent-orders');
    return response.recentOrders;
  },

  // Get low stock items
  getLowStock: async (): Promise<LowStockItem[]> => {
    const response = await apiRequest('/dashboard/low-stock');
    return response.lowStockItems;
  },
};

export default dashboardService;