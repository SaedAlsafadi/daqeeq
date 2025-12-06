const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory items for user's company
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
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

    // Get inventory with product details
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products(
          name,
          sku,
          unit_of_measure,
          unit_cost,
          brand,
          category_id,
          product_categories(name)
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Inventory fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch inventory'
      });
    }

    res.json({
      inventory: inventory || [],
      total: inventory?.length || 0
    });

  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch inventory'
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get items with low stock
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

    // Get all inventory items
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products(name, sku, unit_of_measure)
      `)
      .eq('company_id', companyId)
      .order('current_stock', { ascending: true });

    if (error) {
      console.error('Low stock fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch low stock items'
      });
    }

    // Filter items where current_stock < minimum_stock
    const lowStockItems = inventory?.filter(item => 
      item.current_stock < item.minimum_stock
    ) || [];

    res.json({
      lowStockItems,
      count: lowStockItems.length
    });

  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch low stock items'
    });
  }
});

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      product_id,
      current_stock,
      minimum_stock,
      maximum_stock,
      reorder_point,
      location
    } = req.body;

    // Validate required fields
    if (!product_id || current_stock === undefined || !minimum_stock) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Product ID, current stock, and minimum stock are required'
      });
    }

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

    const inventoryData = {
      company_id: companyId,
      product_id,
      current_stock: parseInt(current_stock),
      minimum_stock: parseInt(minimum_stock),
      maximum_stock: maximum_stock ? parseInt(maximum_stock) : null,
      reorder_point: reorder_point ? parseInt(reorder_point) : null,
      location: location || null,
      last_restocked: new Date().toISOString()
    };

    const { data: newItem, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select(`
        *,
        products(name, sku, unit_of_measure)
      `)
      .single();

    if (error) {
      console.error('Inventory creation error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create inventory item'
      });
    }

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: newItem
    });

  } catch (error) {
    console.error('Inventory creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create inventory item'
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const updates = req.body;

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

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.company_id;

    const { data: updatedItem, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .eq('company_id', companyId)
      .select(`
        *,
        products(name, sku, unit_of_measure)
      `)
      .single();

    if (error) {
      console.error('Inventory update error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update inventory item'
      });
    }

    if (!updatedItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Inventory item not found or access denied'
      });
    }

    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });

  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update inventory item'
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

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

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Inventory deletion error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to delete inventory item'
      });
    }

    res.json({
      message: 'Inventory item deleted successfully'
    });

  } catch (error) {
    console.error('Inventory deletion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete inventory item'
    });
  }
});

module.exports = router;