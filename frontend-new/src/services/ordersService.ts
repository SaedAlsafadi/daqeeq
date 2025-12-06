import apiRequest from './api';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  products?: {
    name: string;
    sku: string;
    unit_of_measure: string;
  };
}

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  supplier_name: string;
  supplier_contact?: any;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  total_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  purchase_order_items?: OrderItem[];
}

export interface CreateOrder {
  supplier_name: string;
  supplier_contact?: any;
  order_date: string;
  expected_delivery?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
}

export const ordersService = {
  // Get all orders
  getAll: async (): Promise<Order[]> => {
    const response = await apiRequest('/orders');
    return response.orders;
  },

  // Get order by ID
  getById: async (id: string): Promise<Order> => {
    const response = await apiRequest(`/orders/${id}`);
    return response.order;
  },

  // Create new order
  create: async (order: CreateOrder): Promise<Order> => {
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return response.order;
  },

  // Update order
  update: async (
    id: string,
    updates: Partial<Pick<Order, 'status' | 'actual_delivery' | 'notes'>>
  ): Promise<Order> => {
    const response = await apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.order;
  },

  // Delete order
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

export default ordersService;