import apiRequest from './api';

export interface InventoryItem {
  id: string;
  product_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point?: number;
  location?: string;
  last_restocked?: string;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    sku: string;
    unit_of_measure: string;
    unit_cost?: number;
  };
}

export interface CreateInventoryItem {
  product_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point?: number;
  location?: string;
}

export const inventoryService = {
  // Get all inventory items
  getAll: async (): Promise<InventoryItem[]> => {
    const response = await apiRequest('/inventory');
    return response.inventory;
  },

  // Get low stock items
  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await apiRequest('/inventory/low-stock');
    return response.lowStockItems;
  },

  // Create new inventory item
  create: async (item: CreateInventoryItem): Promise<InventoryItem> => {
    const response = await apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.item;
  },

  // Update inventory item
  update: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.item;
  },

  // Delete inventory item
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },
};

export default inventoryService;