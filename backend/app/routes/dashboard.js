const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for user's company
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not fetch user information'
      });
    }

    const companyId = user.company_id;

    // Check if user has a company assigned
    if (!companyId) {
      return res.status(400).json({
        error: 'No company assigned',
        message: 'User account is not associated with a company. Please contact support.'
      });
    }

    // Get inventory stats
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('current_stock, minimum_stock, product_id')
      .eq('company_id', companyId);

    // Get product costs for inventory items
    let productCosts = {};
    if (inventory && inventory.length > 0) {
      const productIds = inventory.map(i => i.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, unit_cost')
          .in('id', productIds);
        
        if (products) {
          productCosts = Object.fromEntries(products.map(p => [p.id, p.unit_cost]));
        }
      }
    }

    // Calculate total inventory value
    let totalInventoryValue = 0;
    let lowStockCount = 0;

    if (inventory) {
      inventory.forEach(item => {
        const unitCost = productCosts[item.product_id] || 0;
        totalInventoryValue += item.current_stock * unitCost;
        if (item.current_stock < item.minimum_stock) {
          lowStockCount++;
        }
      });
    }

    // Get active orders count
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status')
      .eq('client_id', companyId)
      .in('status', ['pending', 'confirmed', 'shipped']);

    const activeOrdersCount = orders?.length || 0;

    // Get recent AI predictions for forecast accuracy
    const { data: forecasts, error: forecastError } = await supabase
      .from('ai_predictions')
      .select('predicted_value, prediction_type')
      .eq('client_id', companyId)
      .eq('prediction_type', 'demand_forecast')
      .order('prediction_date', { ascending: false })
      .limit(20);

    // Calculate forecast accuracy (simplified - use confidence scores)
    let forecastAccuracy = 0;
    if (forecasts && forecasts.length > 0) {
      let totalAccuracy = 0;
      forecasts.forEach(forecast => {
        // Use a default confidence or calculate from data
        totalAccuracy += 85; // Default accuracy estimate
      });
      forecastAccuracy = (totalAccuracy / forecasts.length).toFixed(1);
    }

    // Calculate monthly savings (placeholder logic - you can improve this)
    const monthlySavings = totalInventoryValue * 0.08; // 8% savings estimate

    res.json({
      stats: {
        totalInventoryValue: totalInventoryValue.toFixed(2),
        activeOrders: activeOrdersCount,
        monthlySavings: monthlySavings.toFixed(2),
        forecastAccuracy: forecastAccuracy || '0.0',
        lowStockCount
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/recent-orders
// @desc    Get recent orders for user's company
// @access  Private
router.get('/recent-orders', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not fetch user information'
      });
    }

    const companyId = user.company_id;

    // Check if user has a company assigned
    if (!companyId) {
      return res.status(400).json({
        error: 'No company assigned',
        message: 'User account is not associated with a company. Please contact support.'
      });
    }

    // Get recent orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, total_amount')
      .eq('client_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Recent orders fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch recent orders'
      });
    }

    // Get items for these orders
    let orderItems = [];
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id, quantity, inventory_id')
        .in('order_id', orderIds);
      
      orderItems = itemsData || [];
    }

    // Get inventory names for items
    let inventoryNames = {};
    if (orderItems.length > 0) {
      const inventoryIds = orderItems.map(i => i.inventory_id).filter(Boolean);
      if (inventoryIds.length > 0) {
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('id, name')
          .in('id', inventoryIds);
        
        if (inventoryData) {
          inventoryNames = Object.fromEntries(inventoryData.map(p => [p.id, p.name]));
        }
      }
    }

    // Format the orders
    const formattedOrders = orders?.map(order => {
      const itemsForOrder = orderItems
        .filter(i => i.order_id === order.id)
        .slice(0, 2)
        .map(i => inventoryNames[i.inventory_id] || 'Unknown')
        .filter(Boolean)
        .join(', ');

      return {
        id: order.order_number,
        supplier: 'Order',
        items: itemsForOrder || 'No items',
        amount: `$${parseFloat(order.total_amount || 0).toFixed(2)}`,
        status: order.status,
        date: new Date(order.created_at).toISOString().split('T')[0]
      };
    }) || [];

    res.json({
      recentOrders: formattedOrders
    });

  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recent orders'
    });
  }
});

// @route   GET /api/dashboard/low-stock
// @desc    Get low stock items for user's company
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not fetch user information'
      });
    }

    const companyId = user.company_id;

    // Check if user has a company assigned
    if (!companyId) {
      return res.status(400).json({
        error: 'No company assigned',
        message: 'User account is not associated with a company. Please contact support.'
      });
    }

    // Get low stock items
    const { data: lowStockItems, error } = await supabase
      .from('inventory')
      .select('id, current_stock, minimum_stock, reorder_point, product_id')
      .eq('company_id', companyId)
      .order('current_stock', { ascending: true });

    if (error) {
      console.error('Low stock fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch low stock items'
      });
    }

    // Get product names for low stock items
    let productNames = {};
    if (lowStockItems && lowStockItems.length > 0) {
      const productIds = lowStockItems.map(i => i.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        
        if (products) {
          productNames = Object.fromEntries(products.map(p => [p.id, p.name]));
        }
      }
    }

    // Filter and format low stock items
    const formattedItems = lowStockItems
      ?.filter(item => item.current_stock < item.minimum_stock)
      .slice(0, 5)
      .map(item => {
        const stockPercentage = (item.current_stock / item.minimum_stock) * 100;
        return {
          name: productNames[item.product_id] || 'Unknown Product',
          current: item.current_stock,
          minimum: item.minimum_stock,
          status: stockPercentage < 30 ? 'critical' : 'low'
        };
      }) || [];

    res.json({
      lowStockItems: formattedItems
    });

  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch low stock items'
    });
  }
});

module.exports = router;