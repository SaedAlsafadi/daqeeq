const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { supabase, supabaseService } = require('../../config/database');

// Middleware to verify authentication
router.use(authenticateToken);

// Helper function to get company_id for a user
const getUserCompanyId = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Unable to fetch user company information');
  }

  return data.company_id;
};

// Submit supply usage feedback
router.post('/supply-feedback', async (req, res) => {
  try {
    const { user } = req;
    const {
      prediction_id,
      supply_type,
      predicted_quantity,
      actual_quantity,
      feedback_type,
      notes,
      days_until_reorder
    } = req.body;

    // Validate required fields
    if (!supply_type || !predicted_quantity || !actual_quantity) {
      return res.status(400).json({
        error: 'Missing required fields: supply_type, predicted_quantity, actual_quantity'
      });
    }

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    // Insert feedback into database (using service client to bypass RLS)
    const { data, error } = await supabaseService
      .from('supply_feedback')
      .insert([
        {
          company_id: company_id,
          user_id: user.userId,
          prediction_id,
          supply_type,
          predicted_quantity: parseFloat(predicted_quantity),
          actual_quantity: parseFloat(actual_quantity),
          feedback_type,
          notes,
          days_until_reorder: days_until_reorder ? parseInt(days_until_reorder) : null,
          submitted_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting feedback:', error);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    // Notify admins about new feedback submission
    try {
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(10);

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          title: '📊 New Feedback Submitted',
          message: `Feedback received: ${supply_type} (${feedback_type})`,
          type: 'feedback_notification',
          action_url: '/dashboard/admin/feedback-review',
          created_at: new Date().toISOString()
        }));

        await supabaseService
          .from('notifications')
          .insert(notifications);
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    res.json({
      success: true,
      feedback: data[0],
      message: 'Feedback saved successfully'
    });
  } catch (err) {
    console.error('Error in /supply-feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feedback summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const { user } = req;

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    // Get all feedback for the company
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('supply_feedback')
      .select('*')
      .eq('company_id', company_id);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }

    if (!feedbackData || feedbackData.length === 0) {
      return res.json({
        total_feedback: 0,
        accuracy_rate: 0,
        underestimated_count: 0,
        overestimated_count: 0,
        most_accurate_items: [],
        needs_improvement_items: []
      });
    }

    // Calculate statistics
    const accurate = feedbackData.filter(f => f.feedback_type === 'accurate').length;
    const underestimated = feedbackData.filter(f => f.feedback_type === 'underestimated').length;
    const overestimated = feedbackData.filter(f => f.feedback_type === 'overestimated').length;

    const accuracyRate = (accurate / feedbackData.length) * 100;

    // Group by supply type to find most/least accurate
    const bySupplyType = {};
    feedbackData.forEach(feedback => {
      if (!bySupplyType[feedback.supply_type]) {
        bySupplyType[feedback.supply_type] = { accurate: 0, total: 0 };
      }
      bySupplyType[feedback.supply_type].total++;
      if (feedback.feedback_type === 'accurate') {
        bySupplyType[feedback.supply_type].accurate++;
      }
    });

    // Sort by accuracy
    const sortedByAccuracy = Object.entries(bySupplyType)
      .map(([name, stats]) => ({
        name,
        accuracy: (stats.accurate / stats.total) * 100
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const most_accurate_items = sortedByAccuracy
      .slice(0, 3)
      .map(item => item.name);

    const needs_improvement_items = sortedByAccuracy
      .slice(-3)
      .map(item => item.name)
      .reverse();

    res.json({
      total_feedback: feedbackData.length,
      accuracy_rate: Math.round(accuracyRate * 10) / 10,
      underestimated_count: underestimated,
      overestimated_count: overestimated,
      most_accurate_items,
      needs_improvement_items
    });
  } catch (err) {
    console.error('Error in /summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all feedback (admin only)
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Fetch all feedback across all companies
    const { data, error } = await supabase
      .from('supply_feedback')
      .select(`
        id,
        company_id,
        user_id,
        prediction_id,
        supply_type,
        predicted_quantity,
        actual_quantity,
        feedback_type,
        notes,
        days_until_reorder,
        submitted_at,
        created_at
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching all feedback:', error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }

    // Calculate variance for each feedback item
    const feedbackWithVariance = (data || []).map(item => ({
      ...item,
      variance: item.predicted_quantity !== 0 
        ? ((item.actual_quantity - item.predicted_quantity) / item.predicted_quantity) * 100
        : 0
    }));

    // Get total count
    const { count, error: countError } = await supabase
      .from('supply_feedback')
      .select('id', { count: 'exact', head: true });

    res.json({
      feedback: feedbackWithVariance,
      total: count || 0,
      limit,
      offset
    });
  } catch (err) {
    console.error('Error in GET /all:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent feedback entries
router.get('/recent', async (req, res) => {
  try {
    const { user } = req;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    const { data, error } = await supabase
      .from('supply_feedback')
      .select('*')
      .eq('company_id', company_id)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent feedback:', error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }

    res.json({ feedback: data || [] });
  } catch (err) {
    console.error('Error in /recent:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quotation requests with supplier info for feedback form
router.get('/prediction-history', async (req, res) => {
  try {
    const { user } = req;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    // Get recent quotation requests with supplier info
    console.log(`📋 Fetching completed orders for company: ${company_id}, limit: ${limit}`);
    
    const { data: quotations, error: quotError } = await supabase
      .from('quotation_requests')
      .select(`
        id,
        request_number,
        prediction_id,
        provider_id,
        status,
        created_at,
        service_providers (
          id,
          company_name,
          email,
          phone
        ),
        quotation_request_items (
          id,
          item_name,
          quantity,
          unit
        ),
        predictions (
          id,
          predictions
        )
      `)
      .eq('company_id', company_id)
      .in('status', ['contract_signed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (quotError) {
      console.error('❌ Error fetching quotations:', quotError);
      return res.status(500).json({ error: 'Failed to fetch quotation requests' });
    }

    console.log(`✅ Found ${quotations?.length || 0} quotation requests for feedback`);
    if (quotations && quotations.length > 0) {
      quotations.forEach(q => {
        console.log(`   - Request ${q.request_number}: status="${q.status}"`);
      });
    }

    // Transform quotations into feedback-friendly format with grouping by request
    const requestHistory = (quotations || []).map(quotation => {
      const predictionData = quotation.predictions?.predictions || {};
      const items = quotation.quotation_request_items || [];

      return {
        request_id: quotation.id,
        request_number: quotation.request_number,
        prediction_id: quotation.prediction_id,
        supplier: {
          id: quotation.service_providers?.id,
          name: quotation.service_providers?.company_name,
          email: quotation.service_providers?.email,
          phone: quotation.service_providers?.phone
        },
        status: quotation.status,
        created_at: quotation.created_at,
        items: items.map(item => ({
          id: item.id,
          name: item.item_name,
          quantity: item.quantity,
          unit: item.unit
        })),
        predictions: predictionData
      };
    });

    res.json({ requests: requestHistory });
  } catch (err) {
    console.error('Error in /prediction-history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feedback by prediction ID
router.get('/:prediction_id', async (req, res) => {
  try {
    const { user } = req;
    const { prediction_id } = req.params;

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    const { data, error } = await supabase
      .from('supply_feedback')
      .select('*')
      .eq('company_id', company_id)
      .eq('prediction_id', prediction_id);

    if (error) {
      console.error('Error fetching feedback by prediction:', error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }

    res.json({ feedback: data || [] });
  } catch (err) {
    console.error('Error in GET /:prediction_id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit provider feedback and ratings
router.post('/provider-rating', async (req, res) => {
  try {
    const { user } = req;
    const {
      quotation_request_id,
      provider_id,
      quality_rating,
      delivery_rating,
      price_rating,
      notes
    } = req.body;

    // Validate ratings are between 1-5
    if (![quality_rating, delivery_rating, price_rating].every(r => r >= 1 && r <= 5)) {
      return res.status(400).json({
        error: 'Ratings must be between 1 and 5'
      });
    }

    // Get user's company_id
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({
        error: 'No company assigned to user'
      });
    }

    // Insert or update rating (using service client to bypass RLS)
    const { data, error } = await supabaseService
      .from('provider_ratings')
      .insert([
        {
          company_id: company_id,
          provider_id,
          quotation_request_id,
          quality_rating,
          delivery_rating,
          price_rating,
          notes: notes || null,
          created_by: user.userId
        }
      ])
      .select();

    if (error) {
      console.error('Error saving provider rating:', error);
      return res.status(500).json({ error: 'Failed to save rating' });
    }

    // Update provider's average ratings
    const { data: ratings } = await supabase
      .from('provider_ratings')
      .select('quality_rating, delivery_rating, price_rating')
      .eq('provider_id', provider_id);

    if (ratings && ratings.length > 0) {
      const avgQuality = ratings.reduce((sum, r) => sum + r.quality_rating, 0) / ratings.length;
      const avgDelivery = ratings.reduce((sum, r) => sum + r.delivery_rating, 0) / ratings.length;
      const avgPrice = ratings.reduce((sum, r) => sum + r.price_rating, 0) / ratings.length;

      await supabase
        .from('service_providers')
        .update({
          quality_rating_avg: avgQuality,
          delivery_rating_avg: avgDelivery,
          price_rating_avg: avgPrice,
          total_ratings_count: ratings.length
        })
        .eq('id', provider_id);
    }

    res.json({
      success: true,
      message: 'Provider rating saved successfully',
      rating: data[0]
    });
  } catch (err) {
    console.error('Error in /provider-rating:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get provider ratings
router.get('/provider/:provider_id/ratings', async (req, res) => {
  try {
    const { provider_id } = req.params;

    const { data, error } = await supabase
      .from('provider_ratings')
      .select('quality_rating, delivery_rating, price_rating, notes, created_at')
      .eq('provider_id', provider_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching provider ratings:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }

    res.json({ ratings: data || [] });
  } catch (err) {
    console.error('Error in GET /provider/:provider_id/ratings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;