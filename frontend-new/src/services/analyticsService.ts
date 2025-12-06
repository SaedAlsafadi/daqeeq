import { apiRequest } from './api';

export interface DashboardAnalytics {
  totalOrders: number;
  totalSpent: string;
  predictions: number;
}

export interface UsagePattern {
  id: string;
  company_id: string;
  product_id: string;
  usage_date: string;
  quantity_used: number;
  department?: string;
  shift?: string;
  weather_condition?: string;
  special_events?: string;
  products?: {
    name: string;
    unit_of_measure: string;
  };
}

export interface CategoryTrend {
  category: string;
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
}

export interface SpendingAnalytics {
  totalSpending: string;
  dailySpending: Record<string, number>;
  supplierSpending: Record<string, number>;
  period: number;
}

export const analyticsService = {
  // Get dashboard analytics
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await apiRequest('/analytics/dashboard');
    return response.data;
  },

  // Get usage patterns
  getUsage: async (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
  }): Promise<UsagePattern[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiRequest(`/analytics/usage${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  // Get inventory trends
  getInventoryTrends: async (): Promise<CategoryTrend[]> => {
    const response = await apiRequest('/analytics/inventory-trends');
    return response.data;
  },

  // Get spending analytics
  getSpending: async (period: number = 30): Promise<SpendingAnalytics> => {
    const response = await apiRequest(`/analytics/spending?period=${period}`);
    return response.data;
  },
};

export default analyticsService;