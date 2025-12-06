const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

const router = express.Router();

// Middleware to verify service provider access
const verifyServiceProviderAccess = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      console.error('User lookup error:', error);
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', user.id, 'email:', user.email);

    // Check if user is a service provider
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (providerError) {
      console.error('Service provider lookup error:', providerError);
    }
    console.log('Provider lookup result:', provider);

    if (!provider) {
      return res.status(403).json({
        success: false,
        message: 'Not a registered service provider'
      });
    }

    req.provider = provider;
    next();
  } catch (error) {
    console.error('Access verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying access'
    });
  }
};

// ============================================
// SERVICE PROVIDER ROUTES
// ============================================

/**
 * @route   GET /api/service-providers/profile
 * @desc    Get service provider profile
 * @access  Private (Service Provider)
 */
router.get('/profile', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error || !provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    return res.json({
      success: true,
      provider: {
        id: provider.id,
        company_name: provider.company_name,
        email: provider.email,
        phone: provider.phone,
        contact_person: provider.contact_person,
        address: provider.address,
        website: provider.website,
        specialization: provider.specialization,
        service_types: provider.service_types,
        capacity_level: provider.capacity_level,
        rating: provider.rating,
        total_reviews: provider.total_reviews,
        years_in_business: provider.years_in_business,
        service_regions: provider.service_regions,
        minimum_order_value: provider.minimum_order_value,
        delivery_time_days: provider.delivery_time_days,
        payment_terms: provider.payment_terms,
        is_active: provider.is_active,
        is_verified: provider.is_verified,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   PATCH /api/service-providers/profile
 * @desc    Update service provider profile
 * @access  Private (Service Provider)
 */
router.patch('/profile', authenticateToken, verifyServiceProviderAccess, [
  body('company_name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('phone').optional({ checkFalsy: true }).trim().notEmpty(),
  body('contact_person').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
  body('website').optional({ checkFalsy: true }).custom((value) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      throw new Error('Invalid URL format');
    }
    return true;
  }),
  body('specialization').optional({ checkFalsy: true }).isArray(),
  body('service_types').optional({ checkFalsy: true }).isArray(),
  body('capacity_level').optional({ checkFalsy: true }).trim(),
  body('service_regions').optional({ checkFalsy: true }).isArray(),
  body('years_in_business').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('delivery_time_days').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('minimum_order_value').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('payment_terms').optional({ checkFalsy: true }).trim()
], async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const {
      company_name,
      phone,
      contact_person,
      address,
      website,
      specialization,
      service_types,
      capacity_level,
      years_in_business,
      service_regions,
      minimum_order_value,
      delivery_time_days,
      payment_terms
    } = req.body;

    const updateData = {};
    if (company_name) updateData.company_name = company_name;
    if (phone) updateData.phone = phone;
    if (contact_person) updateData.contact_person = contact_person;
    if (address) updateData.address = address;
    if (website) updateData.website = website;
    if (specialization) updateData.specialization = specialization;
    if (service_types) updateData.service_types = service_types;
    if (capacity_level) updateData.capacity_level = capacity_level;
    if (years_in_business !== undefined) updateData.years_in_business = years_in_business;
    if (service_regions) updateData.service_regions = service_regions;
    if (minimum_order_value !== undefined) updateData.minimum_order_value = minimum_order_value;
    if (delivery_time_days !== undefined) updateData.delivery_time_days = delivery_time_days;
    if (payment_terms) updateData.payment_terms = payment_terms;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('service_providers')
      .update(updateData)
      .eq('email', user.email)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    // Auto-verify and activate provider if profile is complete
    if (updated && updated.specialization && updated.capacity_level && updated.company_name) {
      const { data: verified, error: verifyError } = await supabase
        .from('service_providers')
        .update({
          is_verified: true,
          is_active: true
        })
        .eq('id', updated.id)
        .select()
        .single();

      if (verifyError) {
        console.error('Auto-verification error:', verifyError);
      } else if (verified) {
        console.log('Provider auto-verified and activated:', verified.id);
        return res.json({
          success: true,
          message: 'Profile updated successfully and verified!',
          provider: verified
        });
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      provider: updated
    });
  } catch (error) {
    console.error('Error updating provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/requests
 * @desc    Get quotation requests assigned to this service provider
 * @access  Private (Service Provider)
 */
router.get('/requests', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    // Query quotation_requests for this provider
    let query = supabase
      .from('quotation_requests')
      .select(`
        id,
        request_number,
        title,
        description,
        status,
        quoted_amount,
        quoted_delivery_date,
        provider_responded_at,
        requested_at,
        companies(name),
        users(first_name, last_name)
      `)
      .eq('provider_id', provider.id)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('Quotation fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch requests'
      });
    }

    // Fetch items for all requests to calculate totals
    const requestIds = (requests || []).map(r => r.id);
    let itemsMap = {};

    if (requestIds.length > 0) {
      const { data: allItems, error: itemsError } = await supabase
        .from('quotation_request_items')
        .select('quotation_request_id, quantity, total_price, notes')
        .in('quotation_request_id', requestIds);

      if (!itemsError && allItems) {
        itemsMap = allItems.reduce((acc, item) => {
          if (!acc[item.quotation_request_id]) {
            acc[item.quotation_request_id] = [];
          }
          acc[item.quotation_request_id].push(item);
          return acc;
        }, {});
      }
    }

    // Transform data for frontend
    const transformedRequests = (requests || []).map((req) => {
      const items = itemsMap[req.id] || [];
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalValue = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const notes = items.length > 0 ? items[0].notes : null;

      return {
        id: req.id,
        requestNumber: req.request_number,
        title: req.title,
        description: req.description,
        status: req.status,
        quotedAmount: req.quoted_amount,
        quotedDeliveryDate: req.quoted_delivery_date,
        respondedAt: req.provider_responded_at,
        createdAt: req.requested_at,
        clientName: req.companies?.name || 'Unknown Client',
        contactPerson: req.users ? `${req.users.first_name} ${req.users.last_name}` : 'Unknown',
        serviceType: req.description || 'General Service',
        quantity: totalQuantity,
        totalValue: totalValue,
        notes: notes
      };
    });

    return res.json({
      success: true,
      requests: transformedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/dashboard-stats
 * @desc    Get dashboard statistics for service provider
 * @access  Private (Service Provider)
 */
router.get('/dashboard-stats', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('*')
      .eq('email', user.email)
      .single();

    // Get actual quotation request statistics
    const { data: allRequests } = await supabase
      .from('quotation_requests')
      .select('id, status, quoted_amount')
      .eq('provider_id', provider.id);

    const requests = allRequests || [];
    const activeRequests = requests.filter(r => ['pending', 'viewed'].includes(r.status)).length;
    const completedRequests = requests.filter(r => r.status === 'accepted').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
    const totalRevenue = requests
      .filter(r => r.status === 'accepted' && r.quoted_amount)
      .reduce((sum, r) => sum + (r.quoted_amount || 0), 0);

    const stats = {
      activeRequests,
      completedRequests,
      totalRevenue: Math.round(totalRevenue),
      averageRating: provider.rating || 0,
      totalReviews: provider.total_reviews || 0,
      pendingRequests,
      acceptedRequests,
      responseRate: requests.length > 0 ? Math.round(((completedRequests + acceptedRequests) / requests.length) * 100) : 0
    };

    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/onboarding-status
 * @desc    Get onboarding steps status
 * @access  Private (Service Provider)
 */
router.get('/onboarding-status', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    const { data: steps, error } = await supabase
      .from('supplier_onboarding_steps')
      .select('*')
      .eq('service_provider_id', provider.id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch onboarding steps'
      });
    }

    const formattedSteps = steps.map(step => ({
      id: step.id,
      stepName: step.step_name,
      status: step.status,
      completedDate: step.completed_date,
      notes: step.notes
    }));

    const completedCount = formattedSteps.filter(s => s.status === 'completed').length;
    const progress = Math.round((completedCount / formattedSteps.length) * 100);

    return res.json({
      success: true,
      steps: formattedSteps,
      progress,
      totalSteps: formattedSteps.length,
      completedSteps: completedCount
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/communication-log
 * @desc    Get communication history with admin
 * @access  Private (Service Provider)
 */
router.get('/communication-log', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    const { data: logs, error } = await supabase
      .from('supplier_communication_log')
      .select('*')
      .eq('service_provider_id', provider.id)
      .order('communication_date', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch communication log'
      });
    }

    const formattedLogs = logs.map(log => ({
      id: log.id,
      communicationType: log.communication_type,
      subject: log.subject,
      message: log.message,
      communicationDate: log.communication_date,
      status: log.status,
      nextFollowUpDate: log.next_follow_up_date
    }));

    return res.json({
      success: true,
      logs: formattedLogs
    });
  } catch (error) {
    console.error('Error fetching communication log:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   POST /api/service-providers/quotations/:requestId/respond
 * @desc    Send quotation response with price, delivery date, and extra costs
 * @access  Private (Service Provider)
 */
router.post('/quotations/:requestId/respond', authenticateToken, verifyServiceProviderAccess, [
  body('quotedAmount').isFloat({ min: 0 }).toFloat(),
  body('quotedDeliveryDate').isISO8601(),
  body('providerNotes').optional({ checkFalsy: true }).trim(),
  body('extraCosts').optional({ checkFalsy: true }).isArray(),
  body('items').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { requestId } = req.params;
    const { quotedAmount, quotedDeliveryDate, providerNotes, extraCosts, items } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    // Verify the request belongs to this provider
    const { data: quotationRequest, error: fetchError } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('id', requestId)
      .eq('provider_id', provider.id)
      .single();

    if (fetchError || !quotationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or access denied'
      });
    }

    // Validate extra costs structure
    const validatedExtraCosts = (extraCosts || []).map(cost => ({
      id: cost.id || crypto.randomUUID(),
      description: cost.description || '',
      amount: parseFloat(cost.amount) || 0,
      is_percentage: cost.is_percentage || false
    }));

    // Update the quotation request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('quotation_requests')
      .update({
        quoted_amount: quotedAmount,
        quoted_delivery_date: quotedDeliveryDate,
        provider_notes: providerNotes || null,
        extra_costs: validatedExtraCosts,
        provider_responded_at: new Date().toISOString(),
        status: 'quoted'
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Quotation update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send quotation response'
      });
    }

    // Update items with unit prices if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.id && item.unit_price !== undefined) {
          // Get current item to calculate total
          const { data: currentItem } = await supabase
            .from('quotation_request_items')
            .select('quantity')
            .eq('id', item.id)
            .single();

          if (currentItem) {
            const totalPrice = currentItem.quantity * parseFloat(item.unit_price);

            await supabase
              .from('quotation_request_items')
              .update({
                unit_price: parseFloat(item.unit_price),
                total_price: totalPrice
              })
              .eq('id', item.id);
          }
        }
      }
    }

    // Calculate total amount including extra costs
    let totalAmount = quotedAmount;
    validatedExtraCosts.forEach(cost => {
      if (cost.is_percentage) {
        totalAmount += (quotedAmount * cost.amount) / 100;
      } else {
        totalAmount += cost.amount;
      }
    });

    return res.json({
      success: true,
      message: 'Quotation response sent successfully',
      request: {
        ...updatedRequest,
        totalAmount: totalAmount
      }
    });
  } catch (error) {
    console.error('Error sending quotation response:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/quotations/:requestId
 * @desc    Get quotation request details for provider
 * @access  Private (Service Provider)
 */
router.get('/quotations/:requestId', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', user.email)
      .single();

    // Get quotation request
    const { data: quotationRequest, error: fetchError } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('id', requestId)
      .eq('provider_id', provider.id)
      .single();

    if (fetchError || !quotationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or access denied'
      });
    }

    // Get items for this request
    const { data: items, error: itemsError } = await supabase
      .from('quotation_request_items')
      .select('*')
      .eq('quotation_request_id', requestId);

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
    }

    // Get client company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, email, phone')
      .eq('id', quotationRequest.company_id)
      .single();

    // Get client user info
    const { data: clientUser, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', quotationRequest.user_id)
      .single();

    return res.json({
      success: true,
      request: {
        ...quotationRequest,
        items: items || [],
        client: {
          company: company || {},
          user: clientUser || {}
        }
      }
    });
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

/**
 * @route   GET /api/service-providers/analytics
 * @desc    Get provider analytics data
 * @access  Private (Service Provider)
 */
router.get('/analytics', authenticateToken, verifyServiceProviderAccess, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('*')
      .eq('email', user.email)
      .single();

    // Mock analytics data
    const analytics = {
      monthlyRevenue: [
        { month: 'Jan', value: 5000 },
        { month: 'Feb', value: 6000 },
        { month: 'Mar', value: 5500 },
        { month: 'Apr', value: 7000 },
        { month: 'May', value: 8000 },
        { month: 'Jun', value: 6500 }
      ],
      requestsByStatus: {
        pending: 3,
        accepted: 5,
        completed: 12,
        rejected: 2
      },
      serviceBreakdown: [
        { service: 'Cleaning Supplies', count: 8, revenue: 12000 },
        { service: 'Equipment Rental', count: 5, revenue: 15000 },
        { service: 'Maintenance Service', count: 4, revenue: 8000 },
        { service: 'Consulting', count: 3, revenue: 6000 }
      ],
      ratingDistribution: [
        { stars: 5, count: 5 },
        { stars: 4, count: 2 },
        { stars: 3, count: 1 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 }
      ]
    };

    return res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

module.exports = router;