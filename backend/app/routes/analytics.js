const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
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

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Get total spent
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('total_amount')
      .eq('company_id', companyId)
      .eq('status', 'received');

    const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;

    // Get predictions count
    const { count: predictionsCount } = await supabase
      .from('demand_forecasts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    res.json({
      success: true,
      data: {
        totalOrders: totalOrders || 0,
        totalSpent: totalSpent.toFixed(2),
        predictions: predictionsCount || 0
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/usage
// @desc    Get usage patterns and trends
// @access  Private
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { start_date, end_date, product_id } = req.query;

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

    // Build query
    let query = supabase
      .from('usage_patterns')
      .select(`
        *,
        products(name, unit_of_measure)
      `)
      .eq('company_id', companyId)
      .order('usage_date', { ascending: false });

    // Apply filters
    if (start_date) {
      query = query.gte('usage_date', start_date);
    }
    if (end_date) {
      query = query.lte('usage_date', end_date);
    }
    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const { data: usageData, error } = await query.limit(100);

    if (error) {
      console.error('Usage analytics error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch usage analytics'
      });
    }

    res.json({
      success: true,
      data: usageData || []
    });

  } catch (error) {
    console.error('Usage analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch usage analytics'
    });
  }
});

// @route   GET /api/analytics/inventory-trends
// @desc    Get inventory trends over time
// @access  Private
router.get('/inventory-trends', authenticateToken, async (req, res) => {
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

    // Get current inventory with product details
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products(
          name,
          category_id,
          product_categories(name)
        )
      `)
      .eq('company_id', companyId);

    if (error) {
      console.error('Inventory trends error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch inventory trends'
      });
    }

    // Group by category
    const categoryTrends = {};
    inventory?.forEach(item => {
      const categoryName = item.products?.product_categories?.name || 'Uncategorized';
      if (!categoryTrends[categoryName]) {
        categoryTrends[categoryName] = {
          category: categoryName,
          totalItems: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }
      categoryTrends[categoryName].totalItems += 1;
      categoryTrends[categoryName].totalValue += item.current_stock * (item.products?.unit_cost || 0);
      if (item.current_stock < item.minimum_stock) {
        categoryTrends[categoryName].lowStockCount += 1;
      }
    });

    res.json({
      success: true,
      data: Object.values(categoryTrends)
    });

  } catch (error) {
    console.error('Inventory trends error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch inventory trends'
    });
  }
});

// @route   GET /api/analytics/spending
// @desc    Get spending analytics
// @access  Private
router.get('/spending', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { period = '30' } = req.query; // days

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

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get orders in date range
    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select('order_date, total_amount, supplier_name')
      .eq('company_id', companyId)
      .gte('order_date', startDate.toISOString().split('T')[0])
      .lte('order_date', endDate.toISOString().split('T')[0])
      .order('order_date', { ascending: true });

    if (error) {
      console.error('Spending analytics error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch spending analytics'
      });
    }

    // Group by date and supplier
    const dailySpending = {};
    const supplierSpending = {};
    let totalSpending = 0;

    orders?.forEach(order => {
      const date = order.order_date;
      const amount = parseFloat(order.total_amount || 0);
      totalSpending += amount;

      // Daily spending
      if (!dailySpending[date]) {
        dailySpending[date] = 0;
      }
      dailySpending[date] += amount;

      // Supplier spending
      const supplier = order.supplier_name || 'Unknown';
      if (!supplierSpending[supplier]) {
        supplierSpending[supplier] = 0;
      }
      supplierSpending[supplier] += amount;
    });

    res.json({
      success: true,
      data: {
        totalSpending: totalSpending.toFixed(2),
        dailySpending,
        supplierSpending,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Spending analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch spending analytics'
    });
  }
});

module.exports = router;