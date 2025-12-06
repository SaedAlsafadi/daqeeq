const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders for user's company
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

    // Get orders with items
    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items(
          *,
          products(name, sku)
        ),
        created_by_user:users!purchase_orders_created_by_fkey(first_name, last_name, email)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch orders'
      });
    }

    res.json({
      orders: orders || [],
      total: orders?.length || 0
    });

  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new purchase order
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      supplier_name,
      supplier_contact,
      order_date,
      expected_delivery,
      items, // Array of { product_id, quantity, unit_price }
      notes
    } = req.body;

    // Validate required fields
    if (!supplier_name || !order_date || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Supplier name, order date, and items are required'
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

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price) * parseInt(item.quantity));
    }, 0);

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .insert([{
        company_id: companyId,
        order_number: orderNumber,
        supplier_name,
        supplier_contact: supplier_contact || null,
        status: 'pending',
        order_date,
        expected_delivery: expected_delivery || null,
        total_amount: totalAmount,
        notes: notes || null,
        created_by: userId
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create order'
      });
    }

    // Create order items
    const orderItems = items.map(item => ({
      purchase_order_id: newOrder.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.unit_price) * parseInt(item.quantity)
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Rollback order creation if items fail
      await supabase.from('purchase_orders').delete().eq('id', newOrder.id);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create order items'
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create order'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
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

    // Get order with items
    const { data: order, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items(
          *,
          products(name, sku, unit_of_measure)
        ),
        created_by_user:users!purchase_orders_created_by_fkey(first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error || !order) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found or access denied'
      });
    }

    res.json({
      order
    });

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch order'
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { status, actual_delivery, notes } = req.body;

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

    // Update order
    const updates = {};
    if (status) updates.status = status;
    if (actual_delivery) updates.actual_delivery = actual_delivery;
    if (notes !== undefined) updates.notes = notes;

    const { data: updatedOrder, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error || !updatedOrder) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found or access denied'
      });
    }

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update order'
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/delete order
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

    // Delete order (cascade will handle items)
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Order deletion error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to delete order'
      });
    }

    res.json({
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete order'
    });
  }
});

module.exports = router;